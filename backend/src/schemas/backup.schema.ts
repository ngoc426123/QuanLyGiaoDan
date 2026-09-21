import { z } from 'zod'

/**
 * Schema nhóm `backup:*`.
 *
 * Cả hai kênh **không nhận tham số**: đường dẫn file do hộp thoại ở Main quyết định, không
 * nhận từ Renderer. Nếu nhận thì DevTools ghi đè được bất kỳ file nào trên máy.
 */

const backupPasswordSchema = z
  .object({
    password: z.string().min(12, 'Mật khẩu backup phải có ít nhất 12 ký tự.'),
  })
  .strict()

export const backupExportSchema = backupPasswordSchema

export const backupImportSchema = backupPasswordSchema

export const backupClearAllSchema = z
  .object({
    confirmation: z.literal('XÓA DỮ LIỆU', {
      error: 'Hãy nhập đúng câu XÓA DỮ LIỆU để xác nhận',
    }),
  })
  .strict()
