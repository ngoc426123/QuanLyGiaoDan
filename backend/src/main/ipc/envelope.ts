import { app } from 'electron'
import { ZodError } from 'zod'
import { ERROR_CODES, isAppError } from '@shared/errors.ts'

/**
 * Hai hình dạng dữ liệu trả về của mọi handler `invoke` — không có hình dạng thứ ba
 * (`docs/01-architecture/ipc-communication.md` §3).
 *
 *   thành công:  { ok: true,  data, meta? }
 *   thất bại:    { ok: false, error: { code, message, details? } }
 */

/** Ánh xạ mã lỗi SQLite — `docs/02-backend-data/data-services.md` §5.3. */
const SQLITE_ERROR_MAP = Object.freeze({
  SQLITE_CONSTRAINT_UNIQUE: {
    code: ERROR_CODES.CONFLICT,
    message: 'Giá trị này đã tồn tại',
  },
  SQLITE_CONSTRAINT_FOREIGNKEY: {
    code: ERROR_CODES.FOREIGN_KEY_VIOLATION,
    message: 'Không thể xoá vì dữ liệu đang được sử dụng',
  },
  SQLITE_CONSTRAINT_CHECK: {
    code: ERROR_CODES.VALIDATION_ERROR,
    message: 'Dữ liệu không hợp lệ',
  },
  SQLITE_BUSY: {
    code: ERROR_CODES.DB_ERROR,
    message: 'Cơ sở dữ liệu đang bận, vui lòng thử lại',
  },
  SQLITE_READONLY: {
    code: ERROR_CODES.IO_ERROR,
    message: 'Không thể ghi dữ liệu, kiểm tra dung lượng ổ đĩa',
  },
  SQLITE_FULL: {
    code: ERROR_CODES.IO_ERROR,
    message: 'Không thể ghi dữ liệu, kiểm tra dung lượng ổ đĩa',
  },
})

/**
 * Ghi chẩn đoán tạm thời của Phase 1. Phase 6 thay bằng logger ghi ra
 * `userData/logs/` (`plan/phase-6-reliability.md`). Chỉ ghi tên thao tác và stack —
 * **không bao giờ** ghi nội dung người dùng nhập.
 *
 * @param {unknown} err
 */
function logUnexpected(err) {
  const stack = err instanceof Error ? (err.stack ?? err.message) : String(err)
  process.stderr.write(`[ipc] lỗi không phân loại được: ${stack}\n`)
}

/**
 * Gom `issues` của Zod thành `details.fieldErrors` để form gắn lỗi vào từng ô
 * (`docs/02-backend-data/data-services.md` §4.3). Lỗi không gắn với trường nào —
 * ví dụ payload sai kiểu ở gốc — gom vào khoá `_`.
 *
 * @param {ZodError} err
 * @returns {Record<string, string>}
 */
function toFieldErrors(err) {
  /** @type {Record<string, string>} */
  const fieldErrors = {}

  for (const issue of err.issues) {
    const field = issue.path.length > 0 ? issue.path.join('.') : '_'
    // Giữ thông điệp đầu tiên của mỗi trường — ô nhập chỉ hiển thị được một dòng.
    if (!(field in fieldErrors)) fieldErrors[field] = issue.message
  }

  return fieldErrors
}

/**
 * Envelope thành công.
 *
 * @template T
 * @param {T} data
 * @param {{ total: number, page: number, pageSize: number }} [meta] Chỉ dùng cho danh sách phân trang
 */
export function ok(data, meta = undefined) {
  return meta === undefined ? { ok: true, data } : { ok: true, data, meta }
}

/**
 * Envelope thất bại.
 *
 * @param {string} code Một giá trị của `ERROR_CODES`
 * @param {string} message Thông điệp tiếng Việt, hiển thị được trực tiếp
 * @param {Record<string, unknown>} [details]
 */
export function fail(code, message, details = undefined) {
  return details === undefined
    ? { ok: false, error: { code, message } }
    : { ok: false, error: { code, message, details } }
}

/**
 * Chuyển mọi loại lỗi thành envelope thất bại. Đây là nơi **duy nhất** biết cách
 * phân loại lỗi, để mọi handler xử lý lỗi giống hệt nhau.
 *
 * @param {unknown} err
 */
export function toErrorEnvelope(err) {
  if (isAppError(err)) {
    return fail(err.code, err.message, err.details)
  }

  if (err instanceof ZodError) {
    return fail(ERROR_CODES.VALIDATION_ERROR, 'Dữ liệu không hợp lệ', {
      fieldErrors: toFieldErrors(err),
    })
  }

  const sqliteError = typeof err?.code === 'string' ? SQLITE_ERROR_MAP[err.code] : undefined
  if (sqliteError) {
    logUnexpected(err)
    return fail(sqliteError.code, sqliteError.message)
  }

  // Mã SQLITE_* chưa có trong bảng vẫn là lỗi hạ tầng — không để rơi xuống UNKNOWN_ERROR.
  if (typeof err?.code === 'string' && err.code.startsWith('SQLITE_')) {
    logUnexpected(err)
    return fail(ERROR_CODES.DB_ERROR, 'Không truy cập được cơ sở dữ liệu, vui lòng thử lại')
  }

  // Lỗi lập trình: không che giấu. Ghi log kèm stack, trả mã chung cho người dùng.
  logUnexpected(err)

  // Stack trace chỉ gửi sang Renderer ở bản dev — §3.3.
  const details = app.isPackaged
    ? undefined
    : { stack: err instanceof Error ? err.stack : String(err) }

  return fail(ERROR_CODES.UNKNOWN_ERROR, 'Đã xảy ra lỗi không xác định', details)
}
