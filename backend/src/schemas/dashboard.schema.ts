import { z } from 'zod'

const monthSchema = z
  .string({ error: 'Tháng báo cáo không hợp lệ' })
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: 'Tháng báo cáo phải theo định dạng YYYY-MM' })

export const dashboardGetSummarySchema = z
  .object({ month: monthSchema.optional() })
  .strict()
  .default({})
