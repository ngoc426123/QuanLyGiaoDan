/**
 * Tên kênh IPC — nguồn chân lý duy nhất. Cấm magic string ở bất kỳ đâu khác.
 * Danh mục đầy đủ: `project/ipc-channels.md`.
 *
 * Khai báo **đủ cả nhóm** ngay từ Phase 1, kể cả kênh chưa có handler. Hằng số không
 * tốn gì, mà tránh việc mỗi phase lại đi sửa file này (`plan/phase-1-ipc-backbone.md` §1.1).
 *
 * Quy ước (`docs/01-architecture/ipc-communication.md` §2.1):
 * - Request/Response: `<domain>:<action>` — domain là danh từ số ít kebab-case,
 *   action là động từ camelCase.
 * - Event: `event:<domain>-<quá khứ>`.
 * - Dùng `remove`, không dùng `delete` (từ khoá JS).
 */

export const CHANNELS = Object.freeze({
  DASHBOARD: Object.freeze({
    GET_SUMMARY: 'dashboard:getSummary',
  }),
  /** Giáo họ */
  ZONE: Object.freeze({
    LIST: 'zone:list',
    GET_BY_ID: 'zone:getById',
    CREATE: 'zone:create',
    UPDATE: 'zone:update',
    REMOVE: 'zone:remove',
    BULK_REMOVE: 'zone:bulkRemove',
  }),

  /** Gia đình / hộ */
  FAMILY: Object.freeze({
    LIST: 'family:list',
    GET_BY_ID: 'family:getById',
    CREATE: 'family:create',
    UPDATE: 'family:update',
    REMOVE: 'family:remove',
    BULK_MOVE: 'family:bulkMove',
    BULK_REMOVE: 'family:bulkRemove',
  }),

  /** Giáo dân */
  PERSON: Object.freeze({
    LIST: 'person:list',
    GET_BY_ID: 'person:getById',
    CREATE: 'person:create',
    UPDATE: 'person:update',
    REMOVE: 'person:remove',
    BULK_MOVE: 'person:bulkMove',
    BULK_REMOVE: 'person:bulkRemove',
  }),

  MARRIAGE: Object.freeze({
    LIST: 'marriage:list',
    CREATE: 'marriage:create',
    UPDATE: 'marriage:update',
    REMOVE: 'marriage:remove',
  }),

  /** Thành viên hộ — `move` là nghiệp vụ riêng, không nhồi vào `update` */
  FAMILY_MEMBER: Object.freeze({
    ADD: 'family-member:add',
    UPDATE: 'family-member:update',
    MOVE: 'family-member:move',
    REMOVE: 'family-member:remove',
  }),

  /** Hạ tầng — giống nhau ở mọi dự án */
  APP: Object.freeze({
    GET_VERSION: 'app:getVersion',
    GET_PATHS: 'app:getPaths',
    OPEN_DATA_FOLDER: 'app:openDataFolder',
    OPEN_LOG_FOLDER: 'app:openLogFolder',
    CLOSE_WINDOW: 'app:closeWindow',
    MINIMIZE_WINDOW: 'app:minimizeWindow',
    TOGGLE_MAXIMIZE: 'app:toggleMaximize',
    GET_WINDOW_STATE: 'app:getWindowState',
    OPEN_EXTERNAL: 'app:openExternal',
    SHOW_OPEN_DIALOG: 'app:showOpenDialog',
    SHOW_SAVE_DIALOG: 'app:showSaveDialog',
  }),

  /** Xuất / nhập toàn bộ file dữ liệu. Đường dẫn do Main hỏi, Renderer không truyền. */
  BACKUP: Object.freeze({
    CREATE_CONFIRMATION: 'backup:createConfirmation',
    EXPORT: 'backup:export',
    IMPORT: 'backup:import',
    CLEAR_ALL: 'backup:clearAll',
  }),

  REPORT: Object.freeze({
    EXPORT_CSV: 'report:exportCsv',
  }),

  IMPORT: Object.freeze({
    CHOOSE_CSV: 'import:chooseCsv',
    COMMIT_CSV: 'import:commitCsv',
  }),

  SEARCH: Object.freeze({
    QUERY: 'search:query',
  }),

  TRASH: Object.freeze({
    LIST: 'trash:list',
    RESTORE: 'trash:restore',
    HARD_REMOVE: 'trash:hardRemove',
    EMPTY: 'trash:empty',
  }),

  SETTING: Object.freeze({
    GET_ALL: 'setting:getAll',
    SET: 'setting:set',
  }),

  ACTIVITY_LOG: Object.freeze({
    LIST: 'activity-log:list',
  }),

  /** Chỉ dùng cho cửa sổ khóa trước khi Renderer chính được tạo. */
  ENCRYPTION: Object.freeze({
    UNLOCK: 'encryption:unlock',
  }),

  /** Broadcast Main → Renderer. Renderer chỉ dùng để invalidate, không ghi đè cache. */
  EVENTS: Object.freeze({
    SETTING_CHANGED: 'event:setting-changed',
    ZONE_CHANGED: 'event:zone-changed',
    FAMILY_CHANGED: 'event:family-changed',
    PERSON_CHANGED: 'event:person-changed',
    MARRIAGE_CHANGED: 'event:marriage-changed',
    APP_ERROR: 'event:app-error',
    IMPORT_PROGRESS: 'event:import-progress',
    UPDATE_STATUS: 'event:update-status',
    WINDOW_STATE_CHANGED: 'event:window-state-changed',
  }),
})
