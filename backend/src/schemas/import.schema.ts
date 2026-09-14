import { z } from 'zod'

export const importChooseCsvSchema = z.undefined({ error: 'Kênh này không nhận tham số' })

export const importCommitCsvSchema = z
  .object({ token: z.uuid({ error: 'Tệp nhập không hợp lệ hoặc đã hết hạn' }) })
  .strict()
