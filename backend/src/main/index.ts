import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, dialog, ipcMain, safeStorage, screen } from 'electron'
import { bootstrapDatabase } from '#/db/bootstrap.ts'
import { closeDatabase } from '#/db/connection.ts'
import { isPlaintextSqliteDatabase } from '#/db/encryption.ts'
import { now } from '#/services/clock.ts'
import { runStartupMaintenance } from '#/services/maintenance.service.ts'
import { userDataPaths } from './paths.ts'
import { registerIpcHandlers } from './ipc/index.ts'
import { broadcast } from './ipc/broadcast.ts'
import { applySessionSecurity, devServerUrl, hardenWebContents } from './security.ts'
import { readWindowState, restoreWindowState, saveWindowState } from './window-manager.ts'
import { CHANNELS } from '@shared/channels.ts'
import { createLogger } from './logger.ts'
import { migrateLegacyUserDataDirectory, USER_DATA_DIRECTORY_NAME } from './user-data-directory.ts'

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
let logger: ReturnType<typeof createLogger> | null = null
let isUnlockingDatabase = false
let unlockWindow: BrowserWindow | null = null

function databasePasswordVaultPath(dataDir: string) {
  return join(dataDir, 'database-password.bin')
}

function loadStoredDatabasePassword(dataDir: string) {
  const vaultPath = databasePasswordVaultPath(dataDir)
  if (!existsSync(vaultPath)) return null
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Windows không thể mở kho mật khẩu an toàn trên tài khoản này.')
  }
  try {
    return safeStorage.decryptString(readFileSync(vaultPath))
  } catch {
    return null
  }
}

function storeDatabasePassword(dataDir: string, password: string) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Windows không thể lưu mật khẩu an toàn trên tài khoản này.')
  }
  writeFileSync(databasePasswordVaultPath(dataDir), safeStorage.encryptString(password), {
    mode: 0o600,
  })
}

async function requestDatabasePassword({
  isSetup,
  message = '',
}: {
  isSetup: boolean
  message?: string
}) {
  const window = new BrowserWindow({
    width: 640,
    height: isSetup ? 480 : 380,
    resizable: false,
    maximizable: false,
    minimizable: false,
    title: 'Bảo vệ dữ liệu',
    webPreferences: {
      preload: join(currentDir, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  window.setMenu(null)
  unlockWindow = window

  return new Promise<string>((resolve, reject) => {
    let accepted = false
    const close = () => {
      ipcMain.removeHandler(CHANNELS.ENCRYPTION.UNLOCK)
      if (!window.isDestroyed()) window.hide()
    }
    ipcMain.handle(CHANNELS.ENCRYPTION.UNLOCK, (event, input: any) => {
      if (event.sender !== window.webContents || typeof input?.password !== 'string') {
        return { ok: false, message: 'Yêu cầu không hợp lệ.' }
      }
      if (input.password.length < 12 || (isSetup && input.password !== input.confirmation)) {
        return { ok: false, message: 'Mật khẩu không hợp lệ hoặc xác nhận không khớp.' }
      }
      accepted = true
      resolve(input.password)
      close()
      return { ok: true }
    })
    window.once('closed', () => {
      if (unlockWindow === window) unlockWindow = null
      if (!accepted) reject(new Error('Bạn cần mở khóa dữ liệu để dùng ứng dụng.'))
    })
    if (app.isPackaged) {
      window.loadFile(join(currentDir, '../renderer/unlock.html'), {
        query: { setup: isSetup ? '1' : '0', message },
      })
    } else {
      const url = new URL('/unlock.html', devServerUrl)
      url.searchParams.set('setup', isSetup ? '1' : '0')
      url.searchParams.set('message', message)
      window.loadURL(url.toString())
    }
  })
}

async function unlockDatabase(dataDir: string, backupDir: string, message = ''): Promise<any> {
  const dbFile = join(dataDir, 'app.db')
  const isSetup = !existsSync(dbFile) || isPlaintextSqliteDatabase(dbFile)
  isUnlockingDatabase = true
  const storedPassword = isSetup ? null : loadStoredDatabasePassword(dataDir)

  if (storedPassword) {
    try {
      const database = await bootstrapDatabase({
        dataDir,
        backupDir,
        timestamp: now(),
        password: storedPassword,
      })
      isUnlockingDatabase = false
      return database
    } catch {
      closeDatabase()
    }
  }

  const password = await requestDatabasePassword({ isSetup, message })
  try {
    const database = await bootstrapDatabase({ dataDir, backupDir, timestamp: now(), password })
    storeDatabasePassword(dataDir, password)
    isUnlockingDatabase = false
    return database
  } catch (error) {
    if (isSetup) throw error
    closeDatabase()
    unlockWindow?.destroy()
    unlockWindow = null
    return unlockDatabase(dataDir, backupDir, 'Mật khẩu không đúng hoặc file dữ liệu bị hỏng.')
  }
}

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
    frame: false,
    title: 'Quan Ly Giao Dan',
    icon: join(currentDir, '../resources/app-icon.ico'),
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
  let isUnresponsiveDialogOpen = false
  const sendWindowState = () => {
    if (!window.isDestroyed()) {
      window.webContents.send(CHANNELS.EVENTS.WINDOW_STATE_CHANGED, {
        maximized: window.isMaximized(),
      })
    }
  }
  window.setMenu(null)
  window.once('ready-to-show', () => {
    if (isMaximized) window.maximize()
    window.show()
  })
  window.on('close', () => persistWindow(window))
  window.on('maximize', sendWindowState)
  window.on('unmaximize', sendWindowState)
  window.on('closed', () => {
    mainWindow = null
  })

  hardenWebContents(window.webContents)
  window.webContents.on('render-process-gone', (_event, details) => {
    logger?.error('renderer.gone', details)
    dialog
      .showMessageBox(window, {
        type: 'error',
        title: 'Ứng dụng gặp sự cố',
        message: 'Giao diện đã gặp sự cố. Bạn có thể tải lại hoặc thoát ứng dụng.',
        buttons: ['Tải lại', 'Thoát'],
      })
      .then(({ response }) => (response === 0 ? mainWindow?.reload() : app.quit()))
  })
  window.webContents.on('unresponsive', () => {
    logger?.warn('renderer.unresponsive')
    if (isUnresponsiveDialogOpen) return
    isUnresponsiveDialogOpen = true
    dialog
      .showMessageBox(window, {
        type: 'warning',
        title: 'Giao diện đang không phản hồi',
        message: 'Ứng dụng đang chờ phản hồi từ giao diện.',
        detail: 'Bạn có thể tiếp tục chờ, tải lại giao diện hoặc thoát ứng dụng.',
        buttons: ['Tiếp tục chờ', 'Tải lại', 'Thoát'],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 1) window.reload()
        if (response === 2) app.quit()
      })
      .finally(() => {
        isUnresponsiveDialogOpen = false
      })
  })
  window.webContents.on('responsive', () => logger?.info('renderer.responsive'))
  window.webContents.on('preload-error', (_event, _preloadPath, error) => {
    logger?.error('preload.error', error)
    dialog.showErrorBox(
      'Không tải được giao diện',
      'Ứng dụng sẽ đóng vì thành phần giao tiếp an toàn không thể khởi tạo.',
    )
    app.exit(1)
  })

  if (app.isPackaged) {
    mainWindow.loadFile(join(currentDir, '../renderer/index.html'))
  } else {
    mainWindow.loadURL(devServerUrl)
    if (!process.env.ELECRUSION_E2E) mainWindow.webContents.openDevTools({ mode: 'detach' })
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
function configureUserDataDirectory() {
  // Hook cô lập dữ liệu chỉ dành cho E2E bản đóng gói; luồng khởi động thông thường không đặt biến này.
  const e2eUserData = process.env.ELECRUSION_E2E_USER_DATA
  if (e2eUserData) {
    app.setPath('userData', e2eUserData)
    return
  }

  if (app.isPackaged) {
    const appDataDirectory = app.getPath('appData')
    const userDataDirectory = join(appDataDirectory, USER_DATA_DIRECTORY_NAME)
    migrateLegacyUserDataDirectory(appDataDirectory, userDataDirectory)
    app.setPath('userData', userDataDirectory)
    return
  }

  const configuredUserData = process.env.ELECRUSION_USER_DATA
  if (configuredUserData) {
    app.setPath('userData', configuredUserData)
    return
  }

  app.setPath('userData', join(app.getPath('appData'), app.getName() + '-dev'))
}

/**
 * Bước 2 đến 7 của vòng đời. Bất kỳ lỗi nào ở đây đều là lỗi khởi động: `failFast` in log,
 * hiện dialog và thoát — không để app sống tiếp với DB chưa sẵn sàng.
 */
async function startup() {
  savedWindowState = readWindowState(join(app.getPath('userData'), 'window-state.json'))
  const { dataDir, backupDir } = userDataPaths()
  logger = createLogger(userDataPaths().logs)

  await unlockDatabase(dataDir, backupDir)
  const maintenance = await runStartupMaintenance({ backupDir, timestamp: now() })
  logger.info('maintenance.completed', { count: maintenance.trash + maintenance.activities })

  applySessionSecurity()
  registerIpcHandlers()
  createMainWindow()
  unlockWindow?.destroy()
  unlockWindow = null

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
}

// Phải tách `userData` trước khi lấy single-instance lock để bản dev/E2E không khoá nhầm
// phiên ứng dụng đã cài của người dùng.
configureUserDataDirectory()

// Việc đầu tiên còn lại của vòng đời, trước cả `whenReady` — `overview.md` §6.1.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.whenReady().then(startup).catch(failFast)

  process.on('uncaughtException', (error) => {
    logger?.error('process.uncaughtException', error)
    dialog.showErrorBox('Ứng dụng gặp sự cố', 'Ứng dụng sẽ đóng để bảo vệ dữ liệu.')
    app.exit(1)
  })
  process.on('unhandledRejection', (reason) => {
    logger?.error('process.unhandledRejection', reason)
    broadcast(CHANNELS.EVENTS.APP_ERROR, {
      message: 'Một tác vụ nền gặp lỗi. Dữ liệu đã lưu không bị ảnh hưởng.',
    })
  })

  // Đóng kết nối tường minh — `storage-strategy.md` §4. `before-quit` bắn trước khi
  // cửa sổ bị huỷ, nên đây là chỗ cuối cùng còn chắc chắn chạy được.
  app.on('before-quit', () => {
    closeDatabase()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && !isUnlockingDatabase) app.quit()
  })
}
