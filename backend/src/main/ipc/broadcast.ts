import { BrowserWindow } from 'electron'

/**
 * Phát sự kiện tới **mọi** cửa sổ đang mở, không chỉ cửa sổ vừa gọi
 * (`docs/01-architecture/ipc-communication.md` §1). Phase 8 mở nhiều cửa sổ thì
 * không phải sửa lại gì.
 *
 * Gọi ở **bước 5** của handler, sau khi Service đã trả về thành công — và luôn
 * **ngoài** transaction (`data-services.md` §6.3).
 *
 * @param {string} channel Một giá trị của `CHANNELS.EVENTS`
 * @param {unknown} payload Dữ liệu structured-clone được. Renderer chỉ dùng để invalidate
 */
export function broadcast(channel, payload) {
  for (const window of BrowserWindow.getAllWindows()) {
    // Cửa sổ đang đóng dở: `webContents` có thể chết trước `BrowserWindow`.
    if (window.isDestroyed() || window.webContents.isDestroyed()) continue
    window.webContents.send(channel, payload)
  }
}
