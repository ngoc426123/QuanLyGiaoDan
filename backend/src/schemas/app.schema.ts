import { z } from 'zod'

/**
 * Schema validate payload của nhóm kênh `app:*`.
 *
 * Quy ước (`docs/02-backend-data/data-services.md` §4.2):
 * - Một schema cho mỗi kênh, đặt tên theo kênh.
 * - `.strict()` — payload có trường lạ thì **từ chối**, không âm thầm bỏ qua.
 * - Thông điệp lỗi viết tiếng Việt, hướng tới người dùng cuối.
 *
 * Handler **không tin** payload từ Renderer kể cả khi UI đã validate — DevTools gọi
 * thẳng `window.api` được với payload bất kỳ.
 */

/** Kênh không nhận tham số. Gửi kèm bất cứ thứ gì cũng bị từ chối. */
const noPayloadSchema = z.undefined({ error: 'Kênh này không nhận tham số' })

/** Bộ lọc loại file của hộp thoại chọn file. */
const fileFilterSchema = z
  .object(
    {
      name: z
        .string({ error: 'Tên bộ lọc không hợp lệ' })
        .min(1, { error: 'Tên bộ lọc không được để trống' }),
      extensions: z
        .array(z.string({ error: 'Phần mở rộng không hợp lệ' }).min(1), {
          error: 'Danh sách phần mở rộng không hợp lệ',
        })
        .min(1, { error: 'Phải có ít nhất một phần mở rộng' }),
    },
    { error: 'Bộ lọc loại file không hợp lệ' },
  )
  .strict()

export const appGetVersionSchema = noPayloadSchema

export const appGetPathsSchema = noPayloadSchema

export const appCloseWindowSchema = noPayloadSchema
export const appMinimizeWindowSchema = noPayloadSchema
export const appToggleMaximizeSchema = noPayloadSchema
export const appGetWindowStateSchema = noPayloadSchema

/**
 * Whitelist giao thức nằm **ở đây**, tại tầng validate — chặn `javascript:` và
 * `file://` trước khi payload chạm tới `shell.openExternal`
 * (`plan/phase-1-ipc-backbone.md` §1.7).
 */
export const appOpenExternalSchema = z
  .object(
    {
      url: z.url({
        protocol: /^https$/,
        error: 'Chỉ mở được liên kết bắt đầu bằng https://',
      }),
    },
    { error: 'Dữ liệu mở liên kết không hợp lệ' },
  )
  .strict()

export const appShowOpenDialogSchema = z
  .object(
    {
      title: z.string({ error: 'Tiêu đề không hợp lệ' }).max(200).optional(),
      defaultPath: z.string({ error: 'Đường dẫn mặc định không hợp lệ' }).optional(),
      filters: z.array(fileFilterSchema).optional(),
      properties: z
        .array(
          z.enum(['openFile', 'openDirectory', 'multiSelections', 'createDirectory'], {
            error: 'Tuỳ chọn hộp thoại không hợp lệ',
          }),
        )
        .optional(),
    },
    { error: 'Dữ liệu mở hộp thoại không hợp lệ' },
  )
  .strict()
  .default({})

export const appShowSaveDialogSchema = z
  .object(
    {
      title: z.string({ error: 'Tiêu đề không hợp lệ' }).max(200).optional(),
      defaultPath: z.string({ error: 'Đường dẫn mặc định không hợp lệ' }).optional(),
      filters: z.array(fileFilterSchema).optional(),
    },
    { error: 'Dữ liệu lưu file không hợp lệ' },
  )
  .strict()
  .default({})
