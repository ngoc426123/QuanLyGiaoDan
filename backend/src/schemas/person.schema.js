import { z } from 'zod'
import {
  byIdSchema,
  calendarDateSchema,
  idSchema,
  listQueryShape,
  optionalText,
  updateSchema,
} from './common.schema.js'
import { relationshipSchema } from './family-member.schema.js'

/** Schema của nhóm kênh `person:*`. */

const fullNameSchema = z
  .string({ error: 'Họ và tên không hợp lệ' })
  .min(1, { error: 'Họ và tên không được để trống' })
  .max(120, { error: 'Họ và tên không được dài quá 120 ký tự' })

const genderSchema = z.enum(['male', 'female'], { error: 'Giới tính không hợp lệ' }).nullish()

/** Năm cột ngày bí tích + ngày sinh + ngày mất. Bỏ trống được, sai định dạng thì không. */
const dateFields = Object.freeze({
  birthDate: calendarDateSchema.nullish(),
  baptismDate: calendarDateSchema.nullish(),
  firstCommunionDate: calendarDateSchema.nullish(),
  confirmationDate: calendarDateSchema.nullish(),
  marriageDate: calendarDateSchema.nullish(),
  deathDate: calendarDateSchema.nullish(),
})

export const personListSchema = z
  .object(
    {
      ...listQueryShape,
      zoneId: idSchema.nullish(),
      familyId: idSchema.nullish(),
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
    })
    .strict(),
  'giáo dân',
)

export const personRemoveSchema = byIdSchema('giáo dân')
