import { contextBridge, ipcRenderer } from 'electron'
import { CHANNELS } from '@shared/channels.ts'

/**
 * Cầu nối duy nhất giữa Main và Renderer — `docs/01-architecture/ipc-communication.md` §7.
 * Preload là bề mặt tấn công lớn nhất của ứng dụng Electron, sáu luật dưới đây là bắt buộc:
 *
 * 1. Chỉ expose **một** object gốc: `window.api`.
 * 2. Nhóm theo domain, phản chiếu 1-1 danh mục kênh.
 * 3. Mỗi hàm là wrapper **cố định tên kênh** — tên kênh KHÔNG nhận từ tham số của Renderer.
 * 4. Object expose phải `Object.freeze`.
 * 5. Hàm đăng ký listener phải **trả về hàm huỷ đăng ký** để `useEffect` cleanup được.
 * 6. Listener chỉ nhận `payload`, không truyền object `event` của Electron sang Renderer
 *    (nó chứa tham chiếu tới `sender`, rò rỉ quyền).
 *
 * Cấm tuyệt đối: expose `invoke(channel, data)` động, expose nguyên `ipcRenderer`,
 * expose module Node.
 */

/**
 * Đăng ký listener cho một kênh sự kiện và trả về hàm huỷ đăng ký.
 *
 * @param {string} channel Hằng số lấy từ `CHANNELS.EVENTS`
 * @param {(payload: unknown) => void} listener
 * @returns {() => void} Hàm huỷ đăng ký — bắt buộc gọi trong cleanup của `useEffect`
 */
function subscribe(channel, listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('Hàm đăng ký sự kiện cần một listener')
  }

  const forward = (_event, payload) => listener(payload)
  ipcRenderer.on(channel, forward)

  return () => {
    ipcRenderer.removeListener(channel, forward)
  }
}

/** Nhóm `app:*` — hạ tầng, có ở mọi dự án. */
const appApi = Object.freeze({
  getVersion: () => ipcRenderer.invoke(CHANNELS.APP.GET_VERSION),
  getPaths: () => ipcRenderer.invoke(CHANNELS.APP.GET_PATHS),
  openDataFolder: () => ipcRenderer.invoke(CHANNELS.APP.OPEN_DATA_FOLDER),
  openLogFolder: () => ipcRenderer.invoke(CHANNELS.APP.OPEN_LOG_FOLDER),
  closeWindow: () => ipcRenderer.invoke(CHANNELS.APP.CLOSE_WINDOW),
  minimizeWindow: () => ipcRenderer.invoke(CHANNELS.APP.MINIMIZE_WINDOW),
  toggleMaximize: () => ipcRenderer.invoke(CHANNELS.APP.TOGGLE_MAXIMIZE),
  getWindowState: () => ipcRenderer.invoke(CHANNELS.APP.GET_WINDOW_STATE),
  openExternal: (url) => ipcRenderer.invoke(CHANNELS.APP.OPEN_EXTERNAL, { url }),
  showOpenDialog: (options) => ipcRenderer.invoke(CHANNELS.APP.SHOW_OPEN_DIALOG, options),
  showSaveDialog: (options) => ipcRenderer.invoke(CHANNELS.APP.SHOW_SAVE_DIALOG, options),
})

/**
 * Nhóm sự kiện Main → Renderer. Mỗi hàm trả về hàm huỷ đăng ký.
 * Renderer chỉ dùng sự kiện để **invalidate**, không ghi đè cache.
 */
const eventsApi = Object.freeze({
  onSettingChanged: (listener) => subscribe(CHANNELS.EVENTS.SETTING_CHANGED, listener),
  onZoneChanged: (listener) => subscribe(CHANNELS.EVENTS.ZONE_CHANGED, listener),
  onFamilyChanged: (listener) => subscribe(CHANNELS.EVENTS.FAMILY_CHANGED, listener),
  onPersonChanged: (listener) => subscribe(CHANNELS.EVENTS.PERSON_CHANGED, listener),
  onMarriageChanged: (listener) => subscribe(CHANNELS.EVENTS.MARRIAGE_CHANGED, listener),
  onAppError: (listener) => subscribe(CHANNELS.EVENTS.APP_ERROR, listener),
  onImportProgress: (listener) => subscribe(CHANNELS.EVENTS.IMPORT_PROGRESS, listener),
  onUpdateStatus: (listener) => subscribe(CHANNELS.EVENTS.UPDATE_STATUS, listener),
  onWindowStateChanged: (listener) => subscribe(CHANNELS.EVENTS.WINDOW_STATE_CHANGED, listener),
})

/**
 * Xuất / nhập toàn bộ dữ liệu. Không nhận đường dẫn — Main tự mở hộp thoại chọn file.
 * `importFromFile` thành công thì ứng dụng sẽ tự khởi động lại ngay sau đó.
 */
const backupApi = Object.freeze({
  createConfirmation: (action) =>
    ipcRenderer.invoke(CHANNELS.BACKUP.CREATE_CONFIRMATION, { action }),
  exportToFile: (input) => ipcRenderer.invoke(CHANNELS.BACKUP.EXPORT, input),
  importFromFile: (input) => ipcRenderer.invoke(CHANNELS.BACKUP.IMPORT, input),
  clearAll: (input) => ipcRenderer.invoke(CHANNELS.BACKUP.CLEAR_ALL, input),
})

/**
 * Nhóm nghiệp vụ. Mỗi hàm là wrapper **cố định tên kênh** — Renderer không truyền được
 * tên kênh vào, nên không gọi được kênh nào ngoài danh sách này.
 */
const zoneApi = Object.freeze({
  list: (query) => ipcRenderer.invoke(CHANNELS.ZONE.LIST, query),
  getById: (id) => ipcRenderer.invoke(CHANNELS.ZONE.GET_BY_ID, { id }),
  create: (input) => ipcRenderer.invoke(CHANNELS.ZONE.CREATE, input),
  update: (input) => ipcRenderer.invoke(CHANNELS.ZONE.UPDATE, input),
  remove: (id) => ipcRenderer.invoke(CHANNELS.ZONE.REMOVE, { id }),
  bulkRemove: (ids) => ipcRenderer.invoke(CHANNELS.ZONE.BULK_REMOVE, { ids }),
})

const familyApi = Object.freeze({
  list: (query) => ipcRenderer.invoke(CHANNELS.FAMILY.LIST, query),
  getById: (id) => ipcRenderer.invoke(CHANNELS.FAMILY.GET_BY_ID, { id }),
  create: (input) => ipcRenderer.invoke(CHANNELS.FAMILY.CREATE, input),
  update: (input) => ipcRenderer.invoke(CHANNELS.FAMILY.UPDATE, input),
  remove: (id) => ipcRenderer.invoke(CHANNELS.FAMILY.REMOVE, { id }),
  bulkMove: (input) => ipcRenderer.invoke(CHANNELS.FAMILY.BULK_MOVE, input),
  bulkRemove: (ids) => ipcRenderer.invoke(CHANNELS.FAMILY.BULK_REMOVE, { ids }),
})

const personApi = Object.freeze({
  list: (query) => ipcRenderer.invoke(CHANNELS.PERSON.LIST, query),
  getById: (id) => ipcRenderer.invoke(CHANNELS.PERSON.GET_BY_ID, { id }),
  create: (input) => ipcRenderer.invoke(CHANNELS.PERSON.CREATE, input),
  update: (input) => ipcRenderer.invoke(CHANNELS.PERSON.UPDATE, input),
  remove: (id) => ipcRenderer.invoke(CHANNELS.PERSON.REMOVE, { id }),
  bulkMove: (input) => ipcRenderer.invoke(CHANNELS.PERSON.BULK_MOVE, input),
  bulkRemove: (ids) => ipcRenderer.invoke(CHANNELS.PERSON.BULK_REMOVE, { ids }),
})

const marriageApi = Object.freeze({
  list: (query) => ipcRenderer.invoke(CHANNELS.MARRIAGE.LIST, query),
  create: (input) => ipcRenderer.invoke(CHANNELS.MARRIAGE.CREATE, input),
  update: (input) => ipcRenderer.invoke(CHANNELS.MARRIAGE.UPDATE, input),
  remove: (id) => ipcRenderer.invoke(CHANNELS.MARRIAGE.REMOVE, { id }),
})

const familyMemberApi = Object.freeze({
  add: (input) => ipcRenderer.invoke(CHANNELS.FAMILY_MEMBER.ADD, input),
  update: (input) => ipcRenderer.invoke(CHANNELS.FAMILY_MEMBER.UPDATE, input),
  move: (input) => ipcRenderer.invoke(CHANNELS.FAMILY_MEMBER.MOVE, input),
  remove: (id) => ipcRenderer.invoke(CHANNELS.FAMILY_MEMBER.REMOVE, { id }),
})

const dashboardApi = Object.freeze({
  getSummary: () => ipcRenderer.invoke(CHANNELS.DASHBOARD.GET_SUMMARY),
})

const reportApi = Object.freeze({
  exportCsv: (input) => ipcRenderer.invoke(CHANNELS.REPORT.EXPORT_CSV, input),
})
const importApi = Object.freeze({
  chooseCsv: () => ipcRenderer.invoke(CHANNELS.IMPORT.CHOOSE_CSV),
  commitCsv: (token) => ipcRenderer.invoke(CHANNELS.IMPORT.COMMIT_CSV, { token }),
})
const searchApi = Object.freeze({
  query: (query) => ipcRenderer.invoke(CHANNELS.SEARCH.QUERY, { query }),
})
const trashApi = Object.freeze({
  list: () => ipcRenderer.invoke(CHANNELS.TRASH.LIST),
  restore: (input) => ipcRenderer.invoke(CHANNELS.TRASH.RESTORE, input),
  hardRemove: (input) => ipcRenderer.invoke(CHANNELS.TRASH.HARD_REMOVE, input),
  empty: () => ipcRenderer.invoke(CHANNELS.TRASH.EMPTY),
})
const activityLogApi = Object.freeze({
  list: (input) => ipcRenderer.invoke(CHANNELS.ACTIVITY_LOG.LIST, input),
})

const api = Object.freeze({
  setting: Object.freeze({
    getAll: () => ipcRenderer.invoke(CHANNELS.SETTING.GET_ALL),
    set: (input) => ipcRenderer.invoke(CHANNELS.SETTING.SET, input),
  }),
  app: appApi,
  backup: backupApi,
  zone: zoneApi,
  family: familyApi,
  person: personApi,
  marriage: marriageApi,
  familyMember: familyMemberApi,
  dashboard: dashboardApi,
  report: reportApi,
  import: importApi,
  search: searchApi,
  trash: trashApi,
  activityLog: activityLogApi,
  events: eventsApi,
})

contextBridge.exposeInMainWorld('api', api)

// Handler chỉ được Main đăng ký trong lúc cửa sổ mở khóa đang mở.
contextBridge.exposeInMainWorld(
  'encryption',
  Object.freeze({
    unlock: (input) => ipcRenderer.invoke(CHANNELS.ENCRYPTION.UNLOCK, input),
  }),
)
