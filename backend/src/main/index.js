import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, dialog, screen } from 'electron'
import { bootstrapDatabase } from '#/db/bootstrap.js'
import { closeDatabase } from '#/db/connection.js'
import { now } from '#/services/clock.js'
import { userDataPaths } from './paths.js'
import { registerIpcHandlers } from './ipc/index.js'
import { applySessionSecurity, devServerUrl, hardenWebContents } from './security.js'
import { readWindowState, restoreWindowState, saveWindowState } from './window-manager.js'

/**
 * Điểm vào của Main Process. Thứ tự khởi động là bắt buộc — `overview.md` §6.1:
 *
 *   1. requestSingleInstanceLock  -> không có lock thì quit NGAY
 *   2. Đọc PRAGMA user_version bằng kết nối chỉ đọc
 *   3. Phiên bản DB mới hơn bản build -> dialog + quit (chặn hạ cấp)
 *   4. Backup -> chạy migration trong transaction
 *   5. Mở kết nối + set pragma + seed
 *   6. Đăng ký IPC handler
 *   7. Tạo cửa sổ (chỉ hiện khi 'ready-to-show')
 *
 * Bước 2–5 nằm trong `db/bootstrap.js` để chạy được bằng Node thuần trong test.
 */

const currentDir = dirname(fileURLToPath(import.meta.url))

/** @type {BrowserWindow | null} */
let mainWindow = null
let savedWindowState = null

function persistWindow(window) {
  try {
    savedWindowState = { ...window.getNormalBounds(), isMaximized: window.isMaximized() }
    saveWindowState(join(app.getPath('userData'), 'window-state.json'), savedWindowState)
  } catch {
    dialog.showErrorBox(
      'Không lưu được vị trí cửa sổ',
      'Lần mở sau cửa sổ có thể về vị trí mặc định.',
    )
  }
}

function createMainWindow() {
  const { isMaximized, ...bounds } = restoreWindowState(
    savedWindowState,
    screen.getAllDisplays(),
    screen.getPrimaryDisplay(),
  )
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 940,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: join(currentDir, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })

  const window = mainWindow
  window.setMenu(null)
  window.once('ready-to-show', () => {
    if (isMaximized) window.maximize()
    window.show()
  })
  window.on('close', () => persistWindow(window))
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  hardenWebContents(mainWindow.webContents)

  if (app.isPackaged) {
    mainWindow.loadFile(join(currentDir, '../renderer/index.html'))
  } else {
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

/**
 * Lỗi trong lúc khởi động phải **ầm ĩ và gây thoát**.
 *
 * Nếu để lỗi rơi tự do ra khỏi `whenReady().then()`, Electron chỉ in
 * `UnhandledPromiseRejectionWarning` rồi app **sống tiếp mà không có cửa sổ nào** —
 * người dùng thấy một ứng dụng bấm mãi không mở lên. Đây không phải là "bọc try/catch
 * để giấu lỗi đăng ký trùng kênh" (`ipc-communication.md` §8): lỗi vẫn được in đầy đủ
 * và app thoát với mã 1.
 *
 * Phase 6 bổ sung lưới an toàn cấp ứng dụng cho `uncaughtException` /
 * `unhandledRejection` (`data-services.md` §5.5).
 *
 * @param {unknown} err
 */
function failFast(err) {
  const stack = err instanceof Error ? (err.stack ?? err.message) : String(err)
  process.stderr.write(`[main] khởi động thất bại: ${stack}
`)

  dialog.showErrorBox(
    'Không khởi động được ứng dụng',
    err instanceof Error ? err.message : String(err),
  )

  app.exit(1)
}

/**
 * Bản dev ghi vào thư mục `userData` **riêng**, không dùng chung với bản đã cài
 * (`plan/phase-2-data-layer.md` §2.2, `docs/05-git/worktree.md` §4.2).
 *
 * Không tách thì mọi lần chạy thử, mọi migration dở dang, mọi dữ liệu rác trong lúc phát
 * triển đều đổ thẳng vào **dữ liệu thật của người dùng**. Phải gọi trước `whenReady`, vì
 * chỉ cần một lời gọi `app.getPath('userData')` chạy trước là đường dẫn đã bị chốt.
 */
function useSeparateDataDirectoryInDev() {
  if (app.isPackaged) return

  app.setPath('userData', join(app.getPath('appData'), app.getName() + '-dev'))
}

/**
 * Bước 2 đến 7 của vòng đời. Bất kỳ lỗi nào ở đây đều là lỗi khởi động: `failFast` in log,
 * hiện dialog và thoát — không để app sống tiếp với DB chưa sẵn sàng.
 */
async function startup() {
  savedWindowState = readWindowState(join(app.getPath('userData'), 'window-state.json'))
  const { dataDir, backupDir } = userDataPaths()

  await bootstrapDatabase({ dataDir, backupDir, timestamp: now() })

  applySessionSecurity()
  registerIpcHandlers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
}

// Việc đầu tiên của vòng đời, trước cả `whenReady` — `overview.md` §6.1.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  useSeparateDataDirectoryInDev()

  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.whenReady().then(startup).catch(failFast)

  // Đóng kết nối tường minh — `storage-strategy.md` §4. `before-quit` bắn trước khi
  // cửa sổ bị huỷ, nên đây là chỗ cuối cùng còn chắc chắn chạy được.
  app.on('before-quit', () => {
    closeDatabase()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
