import { z } from 'zod'
import { idSchema, listQueryShape } from './common.schema.ts'

const certificateTypeSchema = z.enum(['baptism', 'first_communion', 'confirmation', 'marriage'])
const registerField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { error: `${label} không được để trống` })
    .max(80)

export const certificateIssueSchema = z
  .object({
    personId: idSchema,
    type: certificateTypeSchema,
    registerBook: registerField('Số quyển'),
    registerPage: registerField('Số tờ'),
    registerEntry: registerField('Số thứ tự sổ'),
  })
  .strict()

export const certificateListSchema = z.object(listQueryShape).strict().default({})
