import { z } from 'zod'
import { idSchema, listQueryShape } from './common.schema.ts'

const certificateTypeSchema = z.enum(['baptism', 'confirmation', 'marriage'])
const registerField = () => z.string().trim().max(80)

const draftField = z.string().max(500)
const certificateDraftSchema = z
  .object({
    dioceseName: draftField,
    deaneryName: draftField,
    parishName: draftField,
    parishAddress: draftField,
    parishPhone: draftField,
    parishPriestName: draftField,
    personName: draftField,
    holyName: draftField,
    birthDate: draftField,
    birthPlace: draftField,
    fatherName: draftField,
    motherName: draftField,
    ceremonyDate: draftField,
    ceremonyPlace: draftField,
    minister: draftField,
    sponsor: draftField,
    spouseName: draftField,
    note: draftField,
  })
  .strict()

export const certificateIssueSchema = z
  .object({
    personId: idSchema,
    type: certificateTypeSchema,
    registerBook: registerField(),
    registerPage: registerField(),
    registerEntry: registerField(),
    draft: certificateDraftSchema.optional(),
  })
  .strict()

export const certificateListSchema = z.object(listQueryShape).strict().default({})
