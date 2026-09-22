import { z } from 'zod'
import {
  calendarDateSchema,
  idSchema,
  listQueryShape,
  optionalText,
  updateSchema,
  byIdSchema,
} from './common.schema.ts'

const marriageFields = {
  personId: idSchema,
  spouseId: idSchema,
  date: calendarDateSchema,
  minister: optionalText(120, 'Tên linh mục cử hành'),
  place: optionalText(255, 'Nơi cử hành'),
}

export const marriageListSchema = z.object(listQueryShape).strict().default({})
export const marriageCreateSchema = z.object(marriageFields).strict()
export const marriageUpdateSchema = updateSchema(z.object(marriageFields).strict(), 'hôn phối')
export const marriageRemoveSchema = byIdSchema('hôn phối')
