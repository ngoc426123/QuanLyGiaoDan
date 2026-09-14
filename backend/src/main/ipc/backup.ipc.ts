import { hostname } from 'node:os'
import { app, BrowserWindow, dialog } from 'electron'
import { CHANNELS } from '@shared/channels.ts'
import {
  backupClearAllSchema,
  backupExportSchema,
  backupImportSchema,
} from '#/schemas/backup.schema.ts'
import * as backupService from '#/services/backup.service.ts'
import * as dataService from '#/services/data.service.ts'
import { today } from '#/services/clock.ts'
import { userDataPaths } from '../paths.ts'
import { broadcast } from './broadcast.ts'

/**
 * Handler nhóm `backup:*` — xuất và nhập toàn bộ cơ sở dữ liệu.
 *
 * Renderer **không** truyền đường dẫn: hộp thoại chọn file mở ở Main, nên không có cách nào
 * bắt ứng dụng đọc hoặc ghi vào một đường dẫn tuỳ ý qua DevTools.
 *
 * Nhập dữ liệu là thao tác **phá huỷ**, nên có hai lớp chặn trước khi ghi: soi file nguồn,
 * rồi hộp thoại xác nhận nói rõ file chứa bao nhiêu bản ghi.
 */

const FILE_FILTERS = [{ name: 'Dữ liệu Elecrusion', extensions: ['db'] }]

/** Chờ Renderer nhận xong envelope rồi mới khởi động lại. */
const RESTART_DELAY_MS = 500

function focusedWindow() {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
}

/**
 * Tên file kèm tên máy: mỗi người một máy nên trên USB hay trong hộp thư sẽ có nhiều file
 * cùng ngày. Không có tên máy thì không ai biết file nào của ai.
 */
function suggestedFileName() {
  const machine = hostname()
    .replace(/[^A-Za-z0-9-]/g, '-')
    .slice(0, 30)

  return 'elecrusion-' + today() + '-' + machine + '.db'
}

export const backupHandlers = Object.freeze([
  {
    channel: CHANNELS.BACKUP.EXPORT,
    schema: backupExportSchema,
    handle: async () => {
      const parent = focusedWindow()

      const chosen = await dialog.showSaveDialog(parent, {
        title: 'Xuất dữ liệu ra file',
        defaultPath: suggestedFileName(),
        filters: FILE_FILTERS,
      })

      if (chosen.canceled || !chosen.filePath) return { canceled: true }

      const result = await backupService.exportToFile({ targetPath: chosen.filePath })

      // `security.md` §3: file xuất ra là bản sao **đầy đủ** hồ sơ giáo dân — tên, ngày
      // sinh, địa chỉ, quan hệ gia đình. Người dùng phải được cảnh báo rõ trước khi gửi
      // file này đi đâu đó, vì nó không được mã hoá.
      await dialog.showMessageBox(parent, {
        type: 'info',
        buttons: ['Đã hiểu'],
        title: 'Đã xuất dữ liệu',
        message: 'Đã lưu vào ' + result.filePath,
        detail:
          'File này chứa toàn bộ hồ sơ giáo dân: họ tên, ngày sinh, địa chỉ và quan hệ gia đình. ' +
          'File không được mã hoá, nên hãy cẩn thận khi sao chép hoặc gửi cho người khác.',
      })

      return { canceled: false, ...result }
    },
  },

  {
    channel: CHANNELS.BACKUP.IMPORT,
    schema: backupImportSchema,
    handle: async () => {
      const parent = focusedWindow()
      const { dbFile, backupDir } = userDataPaths()

      const chosen = await dialog.showOpenDialog(parent, {
        title: 'Chọn file dữ liệu để nhập',
        properties: ['openFile'],
        filters: FILE_FILTERS,
      })

      if (chosen.canceled || chosen.filePaths.length === 0) return { canceled: true }

      const sourcePath = chosen.filePaths[0]

      // Soi trước khi hỏi: file hỏng hay không phải của ứng dụng thì báo lỗi luôn,
      // đừng bắt người dùng xác nhận một việc chắc chắn thất bại.
      const info = backupService.inspectFile({ sourcePath, dbFile })

      const confirmed = await dialog.showMessageBox(parent, {
        type: 'warning',
        buttons: ['Huỷ', 'Nhập và thay toàn bộ dữ liệu'],
        defaultId: 0,
        cancelId: 0,
        title: 'Xác nhận nhập dữ liệu',
        message: 'Toàn bộ dữ liệu hiện tại sẽ bị thay bằng dữ liệu trong file',
        detail: backupService.describeImportWarning(info),
      })

      if (confirmed.response !== 1) return { canceled: true }

      const result = await backupService.importFromFile({ dbFile, sourcePath, backupDir })

      // Kết nối đã đóng và file đã bị thay: phải khởi động lại thì mới mở được DB mới và
      // chạy migration nếu file nhập vào có schema cũ hơn.
      setTimeout(() => {
        app.relaunch()
        app.exit(0)
      }, RESTART_DELAY_MS)

      return { canceled: false, restarting: true, divergence: (info as any).divergence, ...result }
    },
  },
  {
    channel: CHANNELS.BACKUP.CLEAR_ALL,
    schema: backupClearAllSchema,
    handle: async () => {
      const { backupDir } = userDataPaths()
      const safetyBackup = await backupService.createSafetyBackup({ backupDir })
      const result = { ...dataService.clearAll(), safetyBackup }
      broadcast(CHANNELS.EVENTS.ZONE_CHANGED, { action: 'cleared' })
      broadcast(CHANNELS.EVENTS.FAMILY_CHANGED, { action: 'cleared' })
      broadcast(CHANNELS.EVENTS.PERSON_CHANGED, { action: 'cleared' })
      return result
    },
  },
])
