import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3-multiple-ciphers'
import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { LATEST_VERSION, MIGRATIONS } from './migrations/index.ts'
import { configureSqlCipher } from './encryption.ts'

/**
 * Migration — `storage-strategy.md` §5.
 *
 * Module này **không** import `electron`: mọi đường dẫn nhận qua tham số.
 *
 * Luồng bắt buộc (`CLAUDE.md` → Khởi động ứng dụng):
 *   1. Đọc `PRAGMA user_version` bằng kết nối **chỉ đọc**
 *   2. `user_version` > số migration cao nhất → dừng, dialog, quit. TUYỆT ĐỐI không mở kết nối ghi
 *   3. Backup DB → chạy migration, mỗi file một transaction
 */

/** Số bản backup giữ lại — `storage-strategy.md` §6. */
const MAX_BACKUPS = 5

const BACKUP_PREFIX = 'app-'
const BACKUP_SUFFIX = '.db'

export { LATEST_VERSION }

/**
 * Đọc phiên bản schema **mà không mở kết nối ghi** — bước 2 của luồng khởi động.
 * File chưa tồn tại nghĩa là DB mới tinh, phiên bản 0.
 *
 * @param {string} dbFile
 * @returns {number}
 */
export function readSchemaVersion(dbFile, password?: string) {
  if (!existsSync(dbFile)) return 0

  const probe = new Database(dbFile, { readonly: true })

  try {
    if (password) configureSqlCipher(probe, password)
    return probe.pragma('user_version', { simple: true })
  } finally {
    probe.close()
  }
}

/**
 * Chặn hạ cấp (`storage-strategy.md` §5.4). DB mới hơn bản build đang chạy thì code cũ
 * không biết các cột mới, ghi đè lên là **hỏng dữ liệu vĩnh viễn**. Thoát là hành vi đúng.
 *
 * @param {number} schemaVersion
 * @throws {AppError} mã `DB_ERROR` khi phát hiện hạ cấp
 */
export function assertNotDowngrade(schemaVersion) {
  if (schemaVersion <= LATEST_VERSION) return

  throw new AppError(
    ERROR_CODES.DB_ERROR,
    'Dữ liệu của bạn được tạo bởi một phiên bản ứng dụng mới hơn. ' +
      'Vui lòng cài lại phiên bản mới nhất để tránh mất dữ liệu.',
    { schemaVersion, supportedVersion: LATEST_VERSION },
  )
}

/** Danh sách migration còn phải chạy, theo thứ tự tăng dần. */
export function pendingMigrations(schemaVersion) {
  return MIGRATIONS.filter((migration) => migration.version > schemaVersion).sort(
    (a, b) => a.version - b.version,
  )
}

/** Xoá bản backup cũ, chỉ giữ `MAX_BACKUPS` bản gần nhất. */
function pruneBackups(backupDir) {
  const files = readdirSync(backupDir)
    .filter((name) => name.startsWith(BACKUP_PREFIX) && name.endsWith(BACKUP_SUFFIX))
    .sort()

  for (const name of files.slice(0, Math.max(0, files.length - MAX_BACKUPS))) {
    rmSync(join(backupDir, name), { force: true })
  }
}

/**
 * Sao lưu bằng `VACUUM INTO`, không copy file thô bằng `fs` — copy thô khi DB đang mở sẽ
 * ra bản backup hỏng. `Database#backup` của SQLite không hỗ trợ DB SQLCipher sang file đích
 * mới, trong khi `VACUUM INTO` tạo một bản sao nhất quán với cùng cấu hình mã hóa.
 *
 * @param {import('better-sqlite3-multiple-ciphers').Database} db
 * @param {string} backupDir
 * @param {string} timestamp Mốc ISO UTC, dùng đặt tên file
 * @returns {Promise<string>} Đường dẫn file backup
 */
export async function backupDatabase(db, backupDir, timestamp) {
  mkdirSync(backupDir, { recursive: true })

  // Dấu `:` không dùng được trong tên file trên Windows.
  const stamp = timestamp.replace(/[:.]/g, '-')
  const target = join(backupDir, `${BACKUP_PREFIX}${stamp}${BACKUP_SUFFIX}`)

  db.exec(`VACUUM INTO ${quoteSqlString(target)}`)
  pruneBackups(backupDir)

  return target
}

function quoteSqlString(value: string) {
  return "'" + value.replace(/'/g, "''") + "'"
}

/**
 * Chạy toàn bộ migration còn thiếu. Mỗi file một transaction: lỗi thì rollback trọn vẹn,
 * `user_version` không đổi, **DB cũ còn nguyên**.
 *
 * Gọi **sau** `assertNotDowngrade`.
 *
 * @param {import('better-sqlite3-multiple-ciphers').Database} db Kết nối ghi, chưa set pragma
 * @param {{ backupDir?: string, timestamp?: string }} [options]
 * @returns {Promise<{ from: number, to: number, applied: string[], backupFile: string | null }>}
 */
export async function migrate(db, options: any = {}) {
  const from = db.pragma('user_version', { simple: true })
  const pending = pendingMigrations(from)

  if (pending.length === 0) {
    return { from, to: from, applied: [], backupFile: null }
  }

  // DB rỗng thì không có gì để mất — bỏ qua backup, tránh rác ngay lần chạy đầu.
  const needsBackup = from > 0 && Boolean(options.backupDir)
  const backupFile = needsBackup
    ? await backupDatabase(db, options.backupDir, options.timestamp ?? new Date().toISOString())
    : null

  for (const migration of pending) {
    const apply = db.transaction(() => {
      db.exec(migration.sql)
      db.pragma(`user_version = ${migration.version}`)
    })

    try {
      apply()
    } catch (cause) {
      throw new AppError(
        ERROR_CODES.DB_ERROR,
        `Không nâng cấp được cơ sở dữ liệu (bước ${migration.name}). Dữ liệu cũ vẫn còn nguyên.`,
        { migration: migration.name, reason: cause.message },
      )
    }
  }

  return {
    from,
    to: pending[pending.length - 1].version,
    applied: pending.map((migration) => migration.name),
    backupFile,
  }
}
