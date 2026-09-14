import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { applyPragmas, openDatabase } from './connection.js'
import { assertNotDowngrade, migrate, readSchemaVersion } from './migrator.js'
import { seedDefaultSettings } from './seed.js'

/**
 * Dựng cơ sở dữ liệu lúc khởi động — bước 2 đến 5 của `CLAUDE.md` → Khởi động ứng dụng.
 *
 * Gom vào đây thay vì rải trong `main/index.js` để chạy được bằng Node thuần trong test:
 * hàm này **không** import `electron`, mọi đường dẫn nhận qua tham số.
 *
 * ```
 * 2. Đọc PRAGMA user_version bằng kết nối CHỈ ĐỌC
 * 3. user_version > số migration cao nhất -> ném lỗi (Main hiện dialog + quit)
 * 4. Backup -> migration, mỗi file một transaction
 * 5. Set pragma, rồi seed cấu hình mặc định
 * ```
 *
 * @param {object} options
 * @param {string} options.dataDir Thư mục chứa `app.db`
 * @param {string} [options.backupDir] Bỏ trống thì không sao lưu (dùng trong test)
 * @param {string} options.timestamp Mốc ISO UTC, dùng cho tên file backup và `updated_at` của seed
 * @returns {Promise<{ dbFile: string, migration: object, db: import('better-sqlite3').Database }>}
 */
export async function bootstrapDatabase({ dataDir, backupDir, timestamp }) {
  mkdirSync(dataDir, { recursive: true })
  const dbFile = join(dataDir, 'app.db')

  // Bước 2 + 3: đọc phiên bản và chặn hạ cấp TRƯỚC khi mở bất kỳ kết nối ghi nào.
  assertNotDowngrade(readSchemaVersion(dbFile))

  const db = openDatabase(dbFile)
  const migration = await migrate(db, { backupDir, timestamp })

  applyPragmas(db)
  seedDefaultSettings(db, timestamp)

  return { dbFile, migration, db }
}
