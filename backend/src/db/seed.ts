import { randomUUID } from 'node:crypto'
import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { BIRTH_PLACE_SUGGESTIONS, HOLY_NAME_SUGGESTIONS } from '@shared/suggestionDefaults.ts'

function ascii(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

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
  'general.deaneryName': '',
  'general.dioceseName': '',
  'general.parishPriestName': '',
  'general.parishAddress': '',
  'general.parishPhone': '',
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
 * @param {import('better-sqlite3-multiple-ciphers').Database} db
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

/** Seed các danh mục gợi ý mặc định; không ghi đè hay phục hồi giá trị người dùng đã xóa. */
export function seedSuggestionItems(db, timestamp) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO suggestion_items ' +
      '(id, category, value, value_ascii, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
  const settings = db
    .prepare('SELECT key, value FROM settings WHERE key IN (?, ?, ?)')
    .all('general.parishName', 'general.parishPriestName', 'general.dioceseName')
  const settingValues = Object.fromEntries(settings.map((row) => [row.key, JSON.parse(row.value)]))
  const defaults = [
    ...HOLY_NAME_SUGGESTIONS.map((value, index) => ({ category: 'holy_name', value, index })),
    ...BIRTH_PLACE_SUGGESTIONS.map((value, index) => ({ category: 'birth_place', value, index })),
    { category: 'parish', value: settingValues['general.parishName'], index: 0 },
    { category: 'priest', value: settingValues['general.parishPriestName'], index: 0 },
    { category: 'diocese', value: settingValues['general.dioceseName'], index: 0 },
  ].filter((item) => typeof item.value === 'string' && item.value.trim())

  const seed = db.transaction(() => {
    let inserted = 0
    for (const item of defaults) {
      inserted += insert.run(
        randomUUID(),
        item.category,
        item.value.trim(),
        ascii(item.value),
        item.index,
        timestamp,
        timestamp,
      ).changes
    }
    return inserted
  })

  try {
    return seed()
  } catch (cause) {
    throw new AppError(ERROR_CODES.DB_ERROR, 'Không ghi được danh mục gợi ý mặc định', {
      reason: cause.message,
    })
  }
}
