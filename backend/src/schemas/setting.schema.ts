import { z } from 'zod'

export const settingGetAllSchema = z.undefined({ error: 'Không nhận tham số cài đặt' })

export const settingSetSchema = z.discriminatedUnion(
  'key',
  [
    z
      .object({
        key: z.literal('ui.theme'),
        value: z.enum(['light', 'dark', 'system'], { error: 'Chế độ giao diện không hợp lệ' }),
      })
      .strict(),
    z
      .object({
        key: z.literal('ui.density'),
        value: z.enum(['comfortable', 'compact'], { error: 'Mật độ hiển thị không hợp lệ' }),
      })
      .strict(),
    z
      .object({
        key: z.literal('general.language'),
        value: z.literal('vi', { error: 'Ứng dụng chỉ hỗ trợ tiếng Việt' }),
      })
      .strict(),
  ],
  { error: 'Khoá cài đặt không được hỗ trợ' },
)
