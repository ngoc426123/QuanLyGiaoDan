import { closeSync, openSync, readSync } from 'node:fs'
import { AppError, ERROR_CODES } from '@shared/errors.ts'

const SQLITE_HEADER = Buffer.from('SQLite format 3\u0000')

/** SQLite mở DB mã hóa chỉ sau khi cipher và key đã được đặt. */
export function configureSqlCipher(db: any, password: string) {
  db.pragma('cipher = sqlcipher')
  db.pragma('legacy = 4')
  db.pragma(`key = ${quotePragmaString(password)}`)
}

/** Đổi khóa sau khi tạo bản sao, để mỗi file backup có thể có mật khẩu riêng. */
export function rekeySqlCipher(db: any, password: string) {
  db.pragma(`rekey = ${quotePragmaString(password)}`)
}

/** Mã hóa một DB SQLite cũ, đang mở bằng kết nối chưa có key. */
export function encryptPlaintextDatabase(db: any, password: string) {
  db.pragma('cipher = sqlcipher')
  db.pragma('legacy = 4')
  rekeySqlCipher(db, password)
}

/** Header SQLite thuần giúp nhận diện dữ liệu cũ trước khi phát hành bản mã hóa đầu tiên. */
export function isPlaintextSqliteDatabase(filePath: string) {
  let handle: number | null = null
  try {
    handle = openSync(filePath, 'r')
    const header = Buffer.alloc(SQLITE_HEADER.length)
    return (
      readSync(handle, header, 0, header.length, 0) === header.length &&
      header.equals(SQLITE_HEADER)
    )
  } catch {
    return false
  } finally {
    if (handle !== null) closeSync(handle)
  }
}

/** Không ghép trực tiếp mật khẩu vào pragma. SQLite không hỗ trợ bind cho PRAGMA key. */
function quotePragmaString(value: string) {
  if (typeof value !== 'string' || value.length < 12) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Mật khẩu dữ liệu phải có ít nhất 12 ký tự.')
  }

  return "'" + value.replace(/'/g, "''") + "'"
}
