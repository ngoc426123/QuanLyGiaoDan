import { app, BrowserWindow, dialog, shell } from 'electron'
import { CHANNELS } from '@shared/channels.js'
import { AppError, ERROR_CODES } from '@shared/errors.js'
import {
  appGetPathsSchema,
  appGetVersionSchema,
  appOpenExternalSchema,
  appShowOpenDialogSchema,
  appShowSaveDialogSchema,
} from '#/schemas/app.schema.js'
import { userDataPaths } from '../paths.js'

/**
 * Nhóm kênh hạ tầng `app:*` — `docs/01-architecture/ipc-communication.md` §5.1.
 *
 * Đây là nhóm duy nhất được phép gọi thẳng `electron`, vì nó nằm ở tầng `ipc/`.
 * Từ Phase 2 trở đi `services/` **không** được import `electron` — cần đường dẫn thì
 * nhận qua tham số (`data-services.md` §3.2).
 */

/** Hộp thoại phải gắn vào cửa sổ cha để khoá đúng cửa sổ, không nổi lung tung. */
function focusedWindow() {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
}

export const appHandlers = Object.freeze([
  {
    channel: CHANNELS.APP.GET_VERSION,
    schema: appGetVersionSchema,
    handle: () => ({
      app: app.getVersion(),
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
    }),
  },

  {
    channel: CHANNELS.APP.GET_PATHS,
    schema: appGetPathsSchema,
    handle: () => {
      const { userData, dbFile, logs } = userDataPaths()

      return { userData, dbFile, logs }
    },
  },

  {
    channel: CHANNELS.APP.OPEN_EXTERNAL,
    // Whitelist giao thức `https:` nằm trong schema — xem `app.schema.js`.
    schema: appOpenExternalSchema,
    handle: async ({ url }) => {
      try {
        await shell.openExternal(url)
      } catch (_cause) {
        throw new AppError(ERROR_CODES.IO_ERROR, 'Không mở được liên kết bằng trình duyệt hệ thống')
      }

      return { opened: true }
    },
  },

  {
    channel: CHANNELS.APP.SHOW_OPEN_DIALOG,
    schema: appShowOpenDialogSchema,
    handle: async (options) => {
      const parent = focusedWindow()
      const result = parent
        ? await dialog.showOpenDialog(parent, options)
        : await dialog.showOpenDialog(options)

      return { canceled: result.canceled, filePaths: result.filePaths }
    },
  },

  {
    channel: CHANNELS.APP.SHOW_SAVE_DIALOG,
    schema: appShowSaveDialogSchema,
    handle: async (options) => {
      const parent = focusedWindow()
      const result = parent
        ? await dialog.showSaveDialog(parent, options)
        : await dialog.showSaveDialog(options)

      return { canceled: result.canceled, filePath: result.filePath ?? null }
    },
  },
])
