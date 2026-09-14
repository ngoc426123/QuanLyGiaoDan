/**
 * Mã lỗi dùng chung giữa Main và Renderer.
 * Frontend phân nhánh theo `error.code`, cấm so khớp `message`.
 *
 * Luật gốc: `docs/01-architecture/ipc-communication.md` §6 và
 * `docs/02-backend-data/data-services.md` §5.
 */

export const ERROR_CODES = Object.freeze({
  /** Payload sai hình dạng — kèm `details.fieldErrors` để form gắn lỗi vào từng ô */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** Bản ghi không tồn tại */
  NOT_FOUND: 'NOT_FOUND',
  /** Trùng giá trị duy nhất, hoặc bản ghi đã bị sửa nơi khác (`details.currentRecord`) */
  CONFLICT: 'CONFLICT',
  /** Xoá bản ghi đang được tham chiếu */
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  /** Lỗi tầng cơ sở dữ liệu */
  DB_ERROR: 'DB_ERROR',
  /** Lỗi đọc/ghi file */
  IO_ERROR: 'IO_ERROR',
  /** Không đủ quyền hệ thống */
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  /** Không phân loại được — phải ghi log kèm stack trace */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
})

/**
 * Lỗi có kiểu, dùng xuyên suốt tầng Service và tầng IPC.
 *
 * `message` viết **tiếng Việt**, hiển thị được trực tiếp trên UI — không nhét stack
 * trace vào đây. Bản thân đối tượng `AppError` không đi qua IPC: tầng `ipc/` chuyển nó
 * thành envelope `{ ok: false, error }` trước khi trả về.
 */
export class AppError extends Error {
  /**
   * @param {string} code Một giá trị của `ERROR_CODES`
   * @param {string} message Thông điệp tiếng Việt, hiển thị được trực tiếp
   * @param {Record<string, unknown>} [details] Dữ liệu phụ trợ cho UI
   */
  constructor(code, message, details) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }
}

/**
 * Nhận diện `AppError` không phụ thuộc `instanceof` — an toàn kể cả khi lớp bị nạp
 * hai lần từ hai bundle khác nhau.
 *
 * @param {unknown} value
 * @returns {value is AppError}
 */
export function isAppError(value) {
  return value instanceof Error && value.name === 'AppError' && typeof value.code === 'string'
}
