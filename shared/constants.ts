/** Hằng số dùng chung cho cả hai phía. JS thuần, không phụ thuộc Node hay React. */

/** Số bản ghi mỗi trang khi không truyền `pageSize`. */
export const PAGE_SIZE_DEFAULT = 50

/** Trần cứng cho `pageSize` — chặn renderer xin cả bảng. */
export const PAGE_SIZE_MAX = 200

/**
 * Địa chỉ dev server của Vite. Main dùng khi `electron-vite` không truyền
 * `VITE_DEV_SERVER_URL`; `frontend/vite.config.js` ghim đúng cổng này.
 */
export const DEV_SERVER_URL = 'http://127.0.0.1:5173'

/**
 * Giá trị `action` trong payload của mọi sự kiện `event:<domain>-changed`.
 * Renderer chỉ dùng để **invalidate**, không ghi đè cache.
 */
export const CHANGE_ACTIONS = Object.freeze({
  CREATED: 'created',
  UPDATED: 'updated',
  REMOVED: 'removed',
  MOVED: 'moved',
})
