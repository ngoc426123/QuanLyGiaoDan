import { z } from 'zod'

/**
 * Schema nhóm `backup:*`.
 *
 * Cả hai kênh **không nhận tham số**: đường dẫn file do hộp thoại ở Main quyết định, không
 * nhận từ Renderer. Nếu nhận thì DevTools ghi đè được bất kỳ file nào trên máy.
 */

const actionSchema = z.enum(['export', 'import', 'clearAll'])

export const backupConfirmationChallengeSchema = z
  .object({
    action: actionSchema,
  })
  .strict()

const sensitiveActionSchema = z
  .object({
    challengeId: z.string().uuid('Mã xác nhận không hợp lệ.'),
    code: z.string().regex(/^\d{6}$/, 'Mã xác nhận phải gồm 6 chữ số.'),
    password: z.string().min(12, 'Mật khẩu dữ liệu phải có ít nhất 12 ký tự.'),
    passwordConfirmation: z.string().min(12, 'Xác nhận mật khẩu phải có ít nhất 12 ký tự.'),
  })
  .strict()

export const backupExportSchema = sensitiveActionSchema

export const backupImportSchema = sensitiveActionSchema.extend({
  backupPassword: z.string().min(12, 'Mật khẩu file backup phải có ít nhất 12 ký tự.').optional(),
})

export const backupClearAllSchema = sensitiveActionSchema
