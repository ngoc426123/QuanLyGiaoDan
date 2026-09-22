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

const zoneFilterSchema = z.object({ zoneId: idSchema.nullish() }).strict()

const monthSchema = z
  .string({ error: 'Tháng báo cáo không hợp lệ' })
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: 'Tháng phải theo định dạng YYYY-MM' })

const monthlyFilterSchema = z.object({ month: monthSchema }).strict()

export const reportExportCsvSchema = z
  .discriminatedUnion('report', [
    z.object({ report: z.literal('persons'), filter: personFilterSchema.default({}) }).strict(),
    z.object({ report: z.literal('families'), filter: familyFilterSchema.default({}) }).strict(),
    z.object({ report: z.literal('zones'), filter: zoneFilterSchema.default({}) }).strict(),
    z
      .object({
        report: z.literal('sacraments'),
        filter: z
          .object({
            zoneId: idSchema.nullish(),
            type: z.enum(['baptism', 'first_communion', 'confirmation']).nullish(),
            month: monthSchema.nullish(),
          })
          .strict()
          .default({}),
      })
      .strict(),
    z.object({ report: z.literal('marriages'), filter: monthlyFilterSchema }).strict(),
    z
      .object({
        report: z.literal('pastoral'),
        filter: z
          .object({
            zoneId: idSchema.nullish(),
            residenceStatus: z.enum(['permanent', 'temporary', 'moved_away']).nullish(),
            pastoralStatus: z.enum(['ordinary', 'catechism', 'catechist', 'needs_visit']).nullish(),
          })
          .strict()
          .default({}),
      })
      .strict(),
    z.object({ report: z.literal('summary'), filter: z.object({}).strict().default({}) }).strict(),
    z
      .object({ report: z.literal('dataQuality'), filter: z.object({}).strict().default({}) })
      .strict(),
    z.object({ report: z.literal('birthdays'), filter: monthlyFilterSchema }).strict(),
    z
      .object({
        report: z.literal('householdMembers'),
        filter: zoneFilterSchema.default({}),
      })
      .strict(),
    z
      .object({
        report: z.literal('familyMembers'),
        filter: z.object({ familyId: idSchema }).strict(),
      })
      .strict(),
  ])
  .default({ report: 'persons', filter: {} })

export const reportExportXlsxSchema = reportExportCsvSchema
export const reportExportPdfSchema = reportExportCsvSchema
export const reportExportPersonProfilePdfSchema = z.object({ personId: idSchema }).strict()
