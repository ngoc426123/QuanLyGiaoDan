import { register } from 'node:module'

/**
 * Nạp resolver cho test chạy bằng `node --test`.
 *
 * Node hiểu sẵn `#/` (khoá `imports` trong `backend/package.json`), nhưng không hiểu hai
 * thứ mà bundler xử lý lúc build: alias `@shared/` và hậu tố `?raw` để nhúng file `.sql`.
 * File này vá đúng hai chỗ đó, không đụng gì tới mã nguồn ứng dụng.
 */
register('./alias-resolve.mjs', import.meta.url)
