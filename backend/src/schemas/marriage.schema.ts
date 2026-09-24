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
  spouseId: idSchema.nullish(),
  spouseName: optionalText(120, 'Tên người phối ngẫu'),
  spouseHolyName: optionalText(75, 'Tên thánh người phối ngẫu'),
  spouseBirthDate: calendarDateSchema.or(z.literal('')).nullish(),
  spouseParishName: optionalText(120, 'Giáo xứ người phối ngẫu'),
  spouseDioceseName: optionalText(120, 'Giáo phận người phối ngẫu'),
  date: calendarDateSchema,
  minister: optionalText(120, 'Tên linh mục cử hành'),
  place: optionalText(255, 'Nơi cử hành'),
  status: z.enum(['married', 'annulled']).default('married'),
  note: optionalText(1000, 'Ghi chú hôn phối'),
  witnessOne: optionalText(120, 'Người chứng hôn thứ nhất'),
  witnessTwo: optionalText(120, 'Người chứng hôn thứ hai'),
}

export const marriageListSchema = z.object(listQueryShape).strict().default({})
const marriagePayloadSchema = z
  .object(marriageFields)
  .strict()
  .superRefine((value, context) => {
    if (!value.spouseId && !value.spouseName?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['spouseName'],
        message: 'Hãy chọn người phối ngẫu trong giáo xứ hoặc nhập tên người ngoài giáo xứ',
      })
    }
  })

export const marriageCreateSchema = marriagePayloadSchema
export const marriageUpdateSchema = updateSchema(marriagePayloadSchema, 'hôn phối')
export const marriageRemoveSchema = byIdSchema('hôn phối')
