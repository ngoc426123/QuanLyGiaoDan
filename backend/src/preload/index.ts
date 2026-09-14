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
  exportToFile: () => ipcRenderer.invoke(CHANNELS.BACKUP.EXPORT),
  importFromFile: () => ipcRenderer.invoke(CHANNELS.BACKUP.IMPORT),
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
})

const familyApi = Object.freeze({
  list: (query) => ipcRenderer.invoke(CHANNELS.FAMILY.LIST, query),
  getById: (id) => ipcRenderer.invoke(CHANNELS.FAMILY.GET_BY_ID, { id }),
  create: (input) => ipcRenderer.invoke(CHANNELS.FAMILY.CREATE, input),
  update: (input) => ipcRenderer.invoke(CHANNELS.FAMILY.UPDATE, input),
  remove: (id) => ipcRenderer.invoke(CHANNELS.FAMILY.REMOVE, { id }),
})

const personApi = Object.freeze({
  list: (query) => ipcRenderer.invoke(CHANNELS.PERSON.LIST, query),
  getById: (id) => ipcRenderer.invoke(CHANNELS.PERSON.GET_BY_ID, { id }),
  create: (input) => ipcRenderer.invoke(CHANNELS.PERSON.CREATE, input),
  update: (input) => ipcRenderer.invoke(CHANNELS.PERSON.UPDATE, input),
  remove: (id) => ipcRenderer.invoke(CHANNELS.PERSON.REMOVE, { id }),
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
  familyMember: familyMemberApi,
  dashboard: dashboardApi,
  events: eventsApi,
})

contextBridge.exposeInMainWorld('api', api)
