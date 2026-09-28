import { z } from 'zod'
import { SUGGESTION_CATEGORIES } from '@shared/suggestionDefaults.ts'
import { idSchema, listQueryShape, updateSchema } from './common.schema.ts'

const categorySchema = z.enum(SUGGESTION_CATEGORIES, { error: 'Loại danh mục gợi ý không hợp lệ' })
const valueSchema = z
  .string({ error: 'Giá trị gợi ý không hợp lệ' })
  .trim()
  .min(1, { error: 'Giá trị gợi ý không được để trống' })
  .max(120, { error: 'Giá trị gợi ý không được dài quá 120 ký tự' })

export const suggestionListSchema = z
  .object(
    { ...listQueryShape, category: categorySchema },
    { error: 'Tham số danh mục gợi ý không hợp lệ' },
  )
  .strict()
export const suggestionCreateSchema = z
  .object(
    {
      category: categorySchema,
      value: valueSchema,
      sortOrder: z.number().int().min(0).max(999999).optional(),
    },
    { error: 'Dữ liệu danh mục gợi ý không hợp lệ' },
  )
  .strict()
export const suggestionUpdateSchema = updateSchema(
  z
    .object({
      value: valueSchema.optional(),
      sortOrder: z.number().int().min(0).max(999999).optional(),
    })
    .strict(),
  'danh mục gợi ý',
)
export const suggestionRemoveSchema = z
  .object({ id: idSchema }, { error: 'Dữ liệu danh mục gợi ý không hợp lệ' })
  .strict()
