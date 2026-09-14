import { z } from 'zod'
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '@shared/constants.ts'

/**
 * Mảnh schema dùng lại giữa các domain. Giữ ở một chỗ để thông điệp lỗi tiếng Việt và
 * giới hạn phân trang không bị lệch nhau giữa các kênh.
 */

/** Id do Service sinh (UUID v4). Renderer chỉ gửi lại id đã nhận, không tự tạo. */
export const idSchema = z.uuid({ error: 'Mã bản ghi không hợp lệ' })

/** Ngày trên lịch — chuỗi `YYYY-MM-DD`, không múi giờ (`database-conventions.md` §1.2b). */
export const calendarDateSchema = z
  .string({ error: 'Ngày không hợp lệ' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Ngày phải theo định dạng YYYY-MM-DD' })

/** Mốc thời gian — chuỗi ISO 8601 UTC. Dùng cho `expectedUpdatedAt`. */
export const timestampSchema = z.iso.datetime({
  error: 'Mốc thời gian không hợp lệ',
})

/**
 * `expectedUpdatedAt` là **bắt buộc** ở mọi kênh `*:update` (`ipc-communication.md` §4b).
 * Thiếu nó thì không có cách nào phát hiện hai cửa sổ ghi đè nhau.
 */
export const expectedUpdatedAtSchema = timestampSchema

/** Ô nhập tuỳ chọn: cho phép bỏ trống, Service tự chuyển chuỗi rỗng thành `null`. */
export function optionalText(maxLength, label) {
  return z
    .string({ error: label + ' không hợp lệ' })
    .max(maxLength, { error: label + ' không được dài quá ' + maxLength + ' ký tự' })
    .nullish()
}

/** Tham số chung của mọi kênh `*:list`. `sortBy` được Repository đối chiếu whitelist. */
export const listQueryShape = Object.freeze({
  search: z.string({ error: 'Từ khoá tìm kiếm không hợp lệ' }).max(200).nullish(),
  page: z.number({ error: 'Số trang không hợp lệ' }).int().min(1).optional(),
  pageSize: z
    .number({ error: 'Số bản ghi mỗi trang không hợp lệ' })
    .int()
    .min(1)
    .max(PAGE_SIZE_MAX, { error: 'Mỗi trang tối đa ' + PAGE_SIZE_MAX + ' bản ghi' })
    .optional(),
  sortBy: z.string({ error: 'Cột sắp xếp không hợp lệ' }).max(50).optional(),
  sortDir: z
    .enum(['asc', 'desc', 'ASC', 'DESC'], { error: 'Chiều sắp xếp không hợp lệ' })
    .optional(),
})

export const PAGE_SIZE = Object.freeze({ default: PAGE_SIZE_DEFAULT, max: PAGE_SIZE_MAX })

/** Khối lượng thao tác hàng loạt bị giới hạn một trang lớn để giữ payload và transaction hữu hạn. */
export const bulkIdsSchema = z
  .array(idSchema, { error: 'Danh sách bản ghi không hợp lệ' })
  .min(1, { error: 'Hãy chọn ít nhất một bản ghi' })
  .max(PAGE_SIZE_MAX, { error: `Mỗi lần chỉ xử lý tối đa ${PAGE_SIZE_MAX} bản ghi` })
  .refine((ids) => new Set(ids).size === ids.length, { error: 'Danh sách bản ghi bị trùng' })

/** Payload chỉ gồm `{ id }` — dùng cho `*:getById` và `*:remove`. */
export function byIdSchema(label) {
  return z.object({ id: idSchema }, { error: 'Dữ liệu ' + label + ' không hợp lệ' }).strict()
}

/**
 * Dựng schema cho kênh `*:update`: `{ id, expectedUpdatedAt, patch }`.
 * `patch` rỗng bị từ chối — gửi lệnh ghi mà không có gì để ghi là lỗi phía gọi.
 *
 * @param {import('zod').ZodObject} patchSchema Đã `.strict()`, mọi trường `optional`
 * @param {string} label Tên thực thể, dùng trong thông điệp lỗi
 */
export function updateSchema(patchSchema, label) {
  return z
    .object(
      {
        id: idSchema,
        expectedUpdatedAt: expectedUpdatedAtSchema,
        patch: patchSchema.refine((value) => Object.keys(value).length > 0, {
          error: 'Không có thông tin nào để cập nhật',
        }),
      },
      { error: 'Dữ liệu cập nhật ' + label + ' không hợp lệ' },
    )
    .strict()
}
