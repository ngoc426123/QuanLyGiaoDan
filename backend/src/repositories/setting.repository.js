import { prepare } from './query-helpers.js'

/** Đọc kho cấu hình hữu hạn; settings không có soft delete theo schema template.
 * @returns {Record<string, unknown>}
 */
export function getAll() {
  return Object.fromEntries(
    prepare('SELECT key, value FROM settings LIMIT 200')
      .all()
      .map(({ key, value }) => [key, JSON.parse(value)]),
  )
}

/** Ghi một khoá có sẵn, không tạo khoá tuỳ ý.
 * @param {{ key: string, value: unknown, updatedAt: string }} input
 * @returns {number}
 */
export function setValue({ key, value, updatedAt }) {
  return prepare('UPDATE settings SET value = ?, updated_at = ? WHERE key = ?').run(
    JSON.stringify(value),
    updatedAt,
    key,
  ).changes
}
