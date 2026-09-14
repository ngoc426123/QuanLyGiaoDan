import { z } from 'zod'
import { idSchema } from './common.schema.ts'

const personFilterSchema = z
  .object({
    zoneId: idSchema.nullish(),
    familyId: idSchema.nullish(),
    gender: z.enum(['male', 'female'], { error: 'Giới tính không hợp lệ' }).nullish(),
    isAlive: z.boolean({ error: 'Bộ lọc còn sống không hợp lệ' }).nullish(),
    search: z.string({ error: 'Từ khoá tìm kiếm không hợp lệ' }).max(120).nullish(),
  })
  .strict()

const familyFilterSchema = z
  .object({ zoneId: idSchema.nullish(), search: z.string().max(120).nullish() })
  .strict()

export const reportExportCsvSchema = z
  .discriminatedUnion('report', [
    z.object({ report: z.literal('persons'), filter: personFilterSchema.default({}) }).strict(),
    z.object({ report: z.literal('families'), filter: familyFilterSchema.default({}) }).strict(),
    z
      .object({
        report: z.literal('familyMembers'),
        filter: z.object({ familyId: idSchema }).strict(),
      })
      .strict(),
  ])
  .default({ report: 'persons', filter: {} })
