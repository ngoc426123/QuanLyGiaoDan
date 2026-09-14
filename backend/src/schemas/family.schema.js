import { z } from 'zod'
import {
  byIdSchema,
  idSchema,
  listQueryShape,
  optionalText,
  updateSchema,
} from './common.schema.js'

/** Schema của nhóm kênh `family:*`. */

const nameSchema = z
  .string({ error: 'Tên hộ không hợp lệ' })
  .min(1, { error: 'Tên hộ không được để trống' })
  .max(120, { error: 'Tên hộ không được dài quá 120 ký tự' })

export const familyListSchema = z
  .object(
    { ...listQueryShape, zoneId: idSchema.nullish() },
    { error: 'Tham số danh sách hộ không hợp lệ' },
  )
  .strict()
  .default({})

export const familyGetByIdSchema = byIdSchema('hộ gia đình')

export const familyCreateSchema = z
  .object(
    {
      zoneId: idSchema,
      name: nameSchema,
      address: optionalText(255, 'Địa chỉ'),
      note: optionalText(2000, 'Ghi chú'),
    },
    { error: 'Dữ liệu hộ gia đình không hợp lệ' },
  )
  .strict()

export const familyUpdateSchema = updateSchema(
  z
    .object({
      zoneId: idSchema.optional(),
      name: nameSchema.optional(),
      address: optionalText(255, 'Địa chỉ'),
      note: optionalText(2000, 'Ghi chú'),
    })
    .strict(),
  'hộ gia đình',
)

export const familyRemoveSchema = byIdSchema('hộ gia đình')
