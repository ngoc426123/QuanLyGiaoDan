import { z } from 'zod'
import {
  byIdSchema,
  bulkIdsSchema,
  calendarDateSchema,
  idSchema,
  listQueryShape,
  optionalText,
  updateSchema,
} from './common.schema.ts'
import { relationshipSchema } from './family-member.schema.ts'

/** Schema của nhóm kênh `person:*`. */

const fullNameSchema = z
  .string({ error: 'Họ và tên không hợp lệ' })
  .min(1, { error: 'Họ và tên không được để trống' })
  .max(120, { error: 'Họ và tên không được dài quá 120 ký tự' })

const genderSchema = z.enum(['male', 'female'], { error: 'Giới tính không hợp lệ' }).nullish()

const sacramentSchema = z
  .object({
    type: z.enum(['baptism', 'first_communion', 'confirmation']),
    date: calendarDateSchema,
    minister: optionalText(120, 'Tên linh mục cử hành'),
    place: optionalText(255, 'Nơi cử hành'),
  })
  .strict()

/** Ngày sinh và ngày mất. Các bí tích nằm trong bảng `sacraments`. */
const dateFields = Object.freeze({
  birthDate: calendarDateSchema.nullish(),
  deathDate: calendarDateSchema.nullish(),
})

const personExtensions = Object.freeze({
  email: optionalText(254, 'Email'),
  occupation: optionalText(120, 'Nghề nghiệp'),
  secondaryPhone: optionalText(20, 'Số liên hệ thay thế'),
  residenceStatus: z.enum(['permanent', 'temporary', 'moved_away']).nullish(),
  pastoralStatus: z.enum(['ordinary', 'catechism', 'catechist', 'needs_visit']).nullish(),
  pastoralNote: optionalText(2000, 'Ghi chú mục vụ'),
  source: z.enum(['manual', 'csv_import', 'transferred', 'restored']).nullish(),
  sacraments: z
    .array(sacramentSchema)
    .max(3, { error: 'Mỗi giáo dân chỉ có một bản ghi cho mỗi bí tích' })
    .refine((rows) => new Set(rows.map((row) => row.type)).size === rows.length, {
      error: 'Mỗi loại bí tích chỉ được nhập một lần',
    })
    .optional(),
})

export const personListSchema = z
  .object(
    {
      ...listQueryShape,
      zoneId: idSchema.nullish(),
      familyId: idSchema.nullish(),
      withoutFamily: z.boolean({ error: 'Bộ lọc chưa thuộc hộ không hợp lệ' }).optional(),
      gender: z.enum(['male', 'female'], { error: 'Giới tính không hợp lệ' }).nullish(),
      isAlive: z.boolean({ error: 'Bộ lọc còn sống không hợp lệ' }).nullish(),
    },
    { error: 'Tham số danh sách giáo dân không hợp lệ' },
  )
  .strict()
  .default({})

export const personGetByIdSchema = byIdSchema('giáo dân')

/**
 * `person:create` nhận thêm `family` tuỳ chọn để tạo người và gán vào hộ trong **một**
 * transaction (`project/ipc-channels.md` §1.3).
 *
 * Renderer **không** gửi `id`, `fullNameAscii`, `createdAt`, `updatedAt` — Service sinh.
 */
export const personCreateSchema = z
  .object(
    {
      fullName: fullNameSchema,
      givenName: optionalText(50, 'Tên gọi'),
      holyName: optionalText(75, 'Tên thánh'),
      gender: genderSchema,
      ...dateFields,
      phone: optionalText(20, 'Số điện thoại'),
      note: optionalText(2000, 'Ghi chú'),
      ...personExtensions,
      family: z
        .object(
          {
            familyId: idSchema,
            relationship: relationshipSchema,
            fromDate: calendarDateSchema,
          },
          { error: 'Thông tin hộ gia đình không hợp lệ' },
        )
        .strict()
        .optional(),
    },
    { error: 'Dữ liệu giáo dân không hợp lệ' },
  )
  .strict()

export const personUpdateSchema = updateSchema(
  z
    .object({
      fullName: fullNameSchema.optional(),
      givenName: optionalText(50, 'Tên gọi'),
      holyName: optionalText(75, 'Tên thánh'),
      gender: genderSchema,
      ...dateFields,
      phone: optionalText(20, 'Số điện thoại'),
      note: optionalText(2000, 'Ghi chú'),
      ...personExtensions,
    })
    .strict(),
  'giáo dân',
)

export const personRemoveSchema = byIdSchema('giáo dân')

export const personBulkMoveSchema = z
  .object({
    ids: bulkIdsSchema,
    familyId: idSchema,
    relationship: relationshipSchema,
    moveDate: calendarDateSchema,
  })
  .strict()

export const personBulkRemoveSchema = z.object({ ids: bulkIdsSchema }).strict()
