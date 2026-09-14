import Database from 'better-sqlite3'
import { AppError, ERROR_CODES } from '@shared/errors.js'

/**
 * Kết nối SQLite dạng singleton — mở **một lần** lúc khởi động, dùng lại suốt vòng đời
 * app, đóng tường minh ở `before-quit` (`storage-strategy.md` §4).
 *
 * Module này **không** import `electron`: đường dẫn file DB nhận qua tham số, để test
 * chạy được bằng Node thuần với `:memory:`.
 */

/** Năm pragma bắt buộc. Thứ tự có ý nghĩa: `journal_mode` đặt trước. */
const PRAGMAS = Object.freeze([
  'journal_mode = WAL',
  'foreign_keys = ON',
  'synchronous = NORMAL',
  'busy_timeout = 5000',
  'temp_store = MEMORY',
])

/** @type {import('better-sqlite3').Database | null} */
let connection = null

/**
 * Áp pragma bắt buộc lên một kết nối bất kỳ. Tách riêng để test dùng lại được.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function applyPragmas(db) {
  for (const pragma of PRAGMAS) db.pragma(pragma)
}

/**
 * Mở kết nối ghi — **chưa set pragma**.
 *
 * Pragma áp sau khi migration chạy xong (`CLAUDE.md` → Khởi động ứng dụng, bước 5): một
 * migration kiểu "rebuild bảng" cần `foreign_keys` **tắt** trong lúc chạy
 * (`storage-strategy.md` §5.6). Bật sẵn từ trước là tự đặt bẫy cho migration sau này.
 *
 * Trình tự đúng ở Main: `openDatabase` → `migrate` → `applyPragmas` → `seedDefaultSettings`.
 *
 * @param {string} filePath Đường dẫn tuyệt đối, do Main dựng bằng `app.getPath()` + `path.join()`
 * @returns {import('better-sqlite3').Database}
 */
export function openDatabase(filePath) {
  if (connection) return connection

  connection = new Database(filePath)

  return connection
}

/**
 * Lấy kết nối đang mở. Gọi trước khi `openDatabase` là lỗi lập trình, không phải lỗi
 * người dùng — ném ngay thay vì trả `null` để tầng trên tự đoán.
 *
 * @returns {import('better-sqlite3').Database}
 */
export function getDatabase() {
  if (!connection) {
    throw new AppError(ERROR_CODES.DB_ERROR, 'Chưa mở kết nối cơ sở dữ liệu')
  }

  return connection
}

/** Đóng kết nối. `PRAGMA optimize` chạy trước khi đóng — `storage-strategy.md` §4. */
export function closeDatabase() {
  if (!connection) return

  connection.pragma('optimize')
  connection.close()
  connection = null
}
