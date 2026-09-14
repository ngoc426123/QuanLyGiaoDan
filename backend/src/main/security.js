import { app, session, shell } from 'electron'
import { DEV_SERVER_URL } from '@shared/constants.js'

/**
 * Cấu hình bảo mật cấp phiên và cấp cửa sổ — `docs/01-architecture/security.md`,
 * `docs/01-architecture/project-structure.md` §8.
 *
 * Bốn việc: chặn điều hướng ra ngoài, chặn mở cửa sổ mới, áp CSP, từ chối mọi
 * yêu cầu quyền.
 */

/** Địa chỉ dev server — khai báo một chỗ, `main/index.js` dùng lại để `loadURL`. */
export const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? DEV_SERVER_URL

/**
 * So khớp **origin**, không dùng `startsWith`: `http://127.0.0.1:5173.ke-gian.com`
 * cũng bắt đầu bằng chuỗi dev server, và sẽ lọt qua nếu so bằng tiền tố.
 */
function isDevServerUrl(url) {
  try {
    return new URL(url).origin === new URL(devServerUrl).origin
  } catch (_cause) {
    return false
  }
}

/** Chỉ `https:` mới được mở bằng trình duyệt hệ thống. Chặn `javascript:` và `file:`. */
function isSafeExternalUrl(url) {
  try {
    return new URL(url).protocol === 'https:'
  } catch (_cause) {
    return false
  }
}

/**
 * Hai chuỗi CSP riêng, chọn theo `app.isPackaged`. Áp bằng header, **không** dùng thẻ
 * `<meta>` — thẻ meta bỏ qua được bằng cách sửa DOM.
 *
 * Bản production sẽ được bật và kiểm chứng trên bản đóng gói ở **Phase 7**.
 */
function contentSecurityPolicy() {
  if (app.isPackaged) {
    return [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-src 'none'",
    ].join('; ')
  }

  // `'unsafe-inline'` chỉ ở dev: @vitejs/plugin-react chèn preamble React Refresh
  // dưới dạng inline script. Chặn nó thì `main.jsx` chết và cửa sổ trắng trơn.
  // Vite HMR cần cả `http` lẫn `ws`. Bản đóng gói ở nhánh trên không có dòng nào trong số này.
  return [
    `default-src 'self' ${devServerUrl}`,
    `script-src 'self' 'unsafe-inline' ${devServerUrl}`,
    `style-src 'self' 'unsafe-inline' ${devServerUrl}`,
    `img-src 'self' data: ${devServerUrl}`,
    `connect-src 'self' ${devServerUrl} ${devServerUrl.replace('http://', 'ws://')}`,
    "object-src 'none'",
  ].join('; ')
}

/**
 * Áp CSP và từ chối mặc định mọi yêu cầu quyền — `overview.md` §3.
 * App hoàn toàn offline, không dùng camera / micro / vị trí / thông báo.
 * Tính năng nào thật sự cần quyền thì mở đúng quyền đó ở đây, không mở cả nắm.
 *
 * Gọi sau `app.whenReady()`, trước khi tạo cửa sổ.
 */
export function applySessionSecurity() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [contentSecurityPolicy()],
      },
    })
  })

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })

  session.defaultSession.setPermissionCheckHandler(() => false)
}

/**
 * Chặn mọi điều hướng ra ngoài và mọi cửa sổ mới; link `https:` mở bằng trình duyệt
 * hệ thống. Gọi cho từng `webContents` ngay khi tạo cửa sổ.
 *
 * @param {Electron.WebContents} contents
 */
export function hardenWebContents(contents) {
  contents.on('will-navigate', (event, url) => {
    // Dev server được phép — HMR điều hướng lại chính trang này.
    if (!app.isPackaged && isDevServerUrl(url)) return

    event.preventDefault()
    if (isSafeExternalUrl(url)) shell.openExternal(url)
  })

  contents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
}
