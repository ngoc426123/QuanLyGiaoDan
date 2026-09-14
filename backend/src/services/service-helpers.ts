import { randomUUID } from 'node:crypto'
import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '@shared/constants.ts'

/**
 * Tiện ích dùng chung của tầng Service. Không chứa nghiệp vụ của riêng thực thể nào,
 * không import `electron` — Service phải chạy được bằng Node thuần để unit test.
 */

/** Id do **Service** sinh, không bao giờ nhận từ Renderer (`data-services.md` §1.1). */
export function newId() {
  return randomUUID()
}

/**
 * Chuẩn hoá chuỗi người dùng nhập trước khi ghi — `data-services.md` §3.3.
 *
 * 1. `trim()`
 * 2. Chuẩn hoá Unicode về **NFC** — bắt buộc với tiếng Việt: cùng chữ "ế" gõ được bằng hai
 *    chuỗi mã khác nhau, không chuẩn hoá thì so sánh và tìm kiếm sai
 * 3. Rỗng sau khi trim → `null`, **không** lưu chuỗi rỗng
 * 4. Cắt bớt nếu vượt giới hạn, thay vì để DB ném `CHECK`
 *
 * @param {unknown} value
 * @param {number} [maxLength]
 * @returns {string | null}
 */
export function normalizeText(value: unknown, maxLength?: number) {
  if (typeof value !== 'string') return null

  const text = value.normalize('NFC').trim()
  if (text === '') return null

  return maxLength && text.length > maxLength ? text.slice(0, maxLength) : text
}

/**
 * Bỏ dấu tiếng Việt và hạ chữ thường — dùng sinh `full_name_ascii` và chuẩn hoá từ khoá
 * tìm kiếm, để gõ "nguyen van an" vẫn tìm ra "Nguyễn Văn An".
 *
 * `đ`/`Đ` không phân rã được bằng NFD nên phải thay tay.
 *
 * @param {string | null} value
 * @returns {string}
 */
export function toAscii(value) {
  if (typeof value !== 'string') return ''

  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Bản ghi không tồn tại là lỗi **mong đợi** — ném `AppError` có mã, không trả `null` mơ hồ
 * để tầng trên tự đoán (`data-services.md` §3.2).
 *
 * @template T
 * @param {T | null} record
 * @param {string} message Thông điệp tiếng Việt, hiển thị được trực tiếp
 * @returns {T}
 */
export function assertFound(record: any, message?: any) {
  if (record === null || record === undefined) {
    throw new AppError(ERROR_CODES.NOT_FOUND, message)
  }

  return record
}

/**
 * Kiểm tra phiên bản lạc quan — `ipc-communication.md` §4b.
 *
 * **Phải gọi bên trong cùng transaction với lệnh ghi**, nếu không vẫn còn khe hở: đọc xong,
 * cửa sổ khác ghi đè, rồi mình mới ghi.
 *
 * @param {{ updatedAt: string }} current Bản ghi vừa đọc trong transaction
 * @param {string} expectedUpdatedAt Giá trị Renderer đang giữ
 */
export function assertVersion(current: any, expectedUpdatedAt?: any) {
  if (current.updatedAt === expectedUpdatedAt) return

  throw new AppError(
    ERROR_CODES.CONFLICT,
    'Bản ghi đã được sửa ở nơi khác. Hãy xem lại thay đổi mới nhất trước khi lưu.',
    { currentRecord: current },
  )
}

/**
 * `meta` của envelope cho danh sách phân trang. Kẹp `pageSize` giống hệt tầng Repository
 * để con số trả về khớp với dữ liệu thật sự được lấy.
 *
 * @param {number} total
 * @param {{ page?: number, pageSize?: number }} [filter]
 */
export function pageMeta(total, filter: any = {}) {
  const pageSize = Math.min(
    Math.max(Number(filter.pageSize) || PAGE_SIZE_DEFAULT, 1),
    PAGE_SIZE_MAX,
  )
  const page = Math.max(Number(filter.page) || 1, 1)

  return { total, page, pageSize }
}

/**
 * So sánh hai ngày dạng `YYYY-MM-DD`. Chuỗi cùng định dạng thì so chuỗi là so ngày —
 * không cần dựng `Date`, tránh luôn bẫy múi giờ.
 *
 * @param {string | null} a
 * @param {string | null} b
 * @returns {boolean} `true` khi cả hai có giá trị và `a` trước `b`
 */
export function isBefore(a, b) {
  return Boolean(a) && Boolean(b) && a < b
}

/**
 * Trường bắt buộc: schema Zod chặn được `undefined` và độ dài, nhưng chuỗi toàn khoảng
 * trắng thì chỉ lộ ra **sau** khi chuẩn hoá. Đây là chốt chặn cuối trước khi ghi.
 *
 * @param {string | null} value Giá trị đã qua `normalizeText`
 * @param {string} field Tên trường theo payload (camelCase) — Renderer gắn lỗi vào đúng ô
 * @param {string} message Thông điệp tiếng Việt
 * @returns {string}
 */
export function requireText(value: any, field?: any, message?: any) {
  if (value === null) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, message, { fieldErrors: { [field]: message } })
  }

  return value
}

/**
 * Lỗi nghiệp vụ gắn với một trường cụ thể — ví dụ "ngày mất trước ngày sinh".
 *
 * @param {string} field
 * @param {string} message
 * @returns {AppError}
 */
export function fieldError(field: any, message?: any) {
  return new AppError(ERROR_CODES.VALIDATION_ERROR, message, {
    fieldErrors: { [field]: message },
  })
}
