import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '@shared/constants.ts'
import { getDatabase } from '#/db/connection.ts'

/**
 * Tiện ích dùng chung của tầng Repository. Không chứa nghiệp vụ, không biết domain.
 *
 * Đây là tầng **duy nhất** được chạm vào `db/` — Service đi qua `runInTransaction`,
 * không tự lấy kết nối (`CLAUDE.md` → chiều phụ thuộc `ipc/ → services/ → repositories/ → db/`).
 */

/** @type {WeakMap<object, Map<string, object>>} */
const statementCache = new WeakMap()

/**
 * Prepared statement chuẩn bị **một lần** rồi tái sử dụng — điểm mạnh hiệu năng lớn nhất
 * của `better-sqlite3`. Cache gắn theo từng kết nối nên mở lại DB (test dùng `:memory:`)
 * không bị dùng nhầm statement cũ.
 *
 * @param {string} sql
 */
export function prepare(sql) {
  const db = getDatabase()

  let perConnection = statementCache.get(db)
  if (!perConnection) {
    perConnection = new Map()
    statementCache.set(db, perConnection)
  }

  let statement = perConnection.get(sql)
  if (!statement) {
    statement = db.prepare(sql)
    perConnection.set(sql, statement)
  }

  return statement
}

/**
 * Chạy một đơn vị công việc trong transaction. **Ranh giới transaction thuộc tầng Service**
 * (`data-services.md` §6.2) — hàm này chỉ cho Service mượn kết nối mà không phải import `db/`.
 *
 * `better-sqlite3` là API đồng bộ: tuyệt đối không `await` việc khác bên trong.
 *
 * @template T
 * @param {() => T} work
 * @returns {T}
 */
export function runInTransaction(work) {
  return getDatabase().transaction(work)()
}

/**
 * Kẹp phân trang về khoảng cho phép. Renderer gửi gì cũng không xin được cả bảng.
 *
 * @param {{ page?: number, pageSize?: number }} [input]
 * @returns {{ limit: number, offset: number, page: number, pageSize: number }}
 */
export function paginate(input: any = {}) {
  const pageSize = Math.min(Math.max(Number(input.pageSize) || PAGE_SIZE_DEFAULT, 1), PAGE_SIZE_MAX)
  const page = Math.max(Number(input.page) || 1, 1)

  return { limit: pageSize, offset: (page - 1) * pageSize, page, pageSize }
}

/**
 * Dựng mệnh đề `ORDER BY` từ **whitelist cứng**. Tên cột không tham số hoá được — đây là
 * ngoại lệ duy nhất được ghép chuỗi (`coding-standards-backend.md` §3.1).
 *
 * Giá trị ngoài whitelist → dùng mặc định, **không** ném lỗi ra người dùng.
 *
 * @param {Record<string, string>} allowed Ánh xạ `sortBy` (camelCase) → tên cột SQL
 * @param {string} defaultKey Khoá mặc định, phải có trong `allowed`
 * @param {{ sortBy?: string, sortDir?: string }} [input]
 * @returns {string} ví dụ `given_name ASC`
 */
export function orderBy(allowed, defaultKey, input: any = {}, defaultDirection = 'ASC') {
  const hasRequestedSort = Object.hasOwn(allowed, input.sortBy)
  const column = hasRequestedSort ? allowed[input.sortBy] : allowed[defaultKey]
  const direction = input.sortDir
    ? String(input.sortDir).toUpperCase() === 'DESC'
      ? 'DESC'
      : 'ASC'
    : defaultDirection

  return `${column} ${direction}`
}

/**
 * Mẫu `LIKE` cho tìm kiếm chứa chuỗi con. Escape ba ký tự đặc biệt để người dùng gõ dấu
 * `%` không biến thành ký tự đại diện. Dùng kèm `ESCAPE` trong câu truy vấn.
 *
 * @param {string} term
 */
export function likePattern(term) {
  const specials = new Set(['\\', '%', '_'])
  let escaped = ''

  for (const char of term) {
    if (specials.has(char)) escaped += '\\'
    escaped += char
  }

  return `%${escaped}%`
}
