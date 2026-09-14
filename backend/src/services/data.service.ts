import { runInTransaction } from '#/repositories/query-helpers.ts'
import * as dataRepository from '#/repositories/data.repository.ts'

/** Đặt lại dữ liệu nghiệp vụ để kiểm thử nhập liệu; không xoá cấu hình ứng dụng. */
export function clearAll() {
  return runInTransaction(() => dataRepository.clearAll())
}
