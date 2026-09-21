import { AppError, ERROR_CODES } from '@shared/errors.ts'

/**
 * Seed bảng `settings` — `project/database-schema.md` §5.
 *
 * **Không seed dữ liệu nghiệp vụ mẫu**: dữ liệu giáo dân là dữ liệu thật, bản ghi mẫu sẽ
 * lẫn vào danh sách và người dùng phải đi xoá. Màn hình trống dùng `EmptyState` thay cho seed.
 *
 * Giá trị lưu dạng **chuỗi JSON** để giữ đúng kiểu khi đọc ra
 * (`database-conventions.md` §2).
 */
export const DEFAULT_SETTINGS = Object.freeze({
  'ui.theme': 'system',
  'ui.density': 'comfortable',
  'ui.sidebarWidth': 260,
  'general.language': 'vi',
  'general.parishName': '',
  'general.startOfWeek': 1,
  'data.autoBackup': true,
  'data.backupIntervalDays': 7,
  'data.trashRetentionDays': 30,
  'data.lastVacuumAt': null,
})

/**
 * Idempotent: `INSERT OR IGNORE` nên chạy lại nhiều lần không ghi đè giá trị người dùng
 * đã đổi, cũng không sinh dòng trùng.
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} timestamp Mốc ISO 8601 UTC
 * @returns {number} Số khoá vừa được thêm mới
 */
export function seedDefaultSettings(db, timestamp) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
  )

  const seed = db.transaction(() => {
    let inserted = 0

    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      inserted += insert.run(key, JSON.stringify(value), timestamp).changes
    }

    return inserted
  })

  try {
    return seed()
  } catch (cause) {
    throw new AppError(ERROR_CODES.DB_ERROR, 'Không ghi được cấu hình mặc định', {
      reason: cause.message,
    })
  }
}
