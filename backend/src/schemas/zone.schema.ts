import { z } from 'zod'
import { byIdSchema, listQueryShape, optionalText, updateSchema } from './common.schema.ts'

/** Schema của nhóm kênh `zone:*`. Một schema cho mỗi kênh, `.strict()`, lỗi tiếng Việt. */

const nameSchema = z
  .string({ error: 'Tên giáo họ không hợp lệ' })
  .min(1, { error: 'Tên giáo họ không được để trống' })
  .max(100, { error: 'Tên giáo họ không được dài quá 100 ký tự' })

export const zoneListSchema = z
  .object(listQueryShape, { error: 'Tham số danh sách giáo họ không hợp lệ' })
  .strict()
  .default({})

export const zoneGetByIdSchema = byIdSchema('giáo họ')

export const zoneCreateSchema = z
  .object(
    {
      name: nameSchema,
      holyName: optionalText(75, 'Bổn mạng'),
      note: optionalText(2000, 'Ghi chú'),
    },
    { error: 'Dữ liệu giáo họ không hợp lệ' },
  )
  .strict()

export const zoneUpdateSchema = updateSchema(
  z
    .object({
      name: nameSchema.optional(),
      holyName: optionalText(75, 'Bổn mạng'),
      note: optionalText(2000, 'Ghi chú'),
    })
    .strict(),
  'giáo họ',
)

export const zoneRemoveSchema = byIdSchema('giáo họ')
