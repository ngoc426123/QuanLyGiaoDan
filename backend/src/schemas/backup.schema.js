import { z } from 'zod'

/**
 * Schema nhóm `backup:*`.
 *
 * Cả hai kênh **không nhận tham số**: đường dẫn file do hộp thoại ở Main quyết định, không
 * nhận từ Renderer. Nếu nhận thì DevTools ghi đè được bất kỳ file nào trên máy.
 */

const noPayloadSchema = z.undefined({ error: 'Kênh này không nhận tham số' })

export const backupExportSchema = noPayloadSchema

export const backupImportSchema = noPayloadSchema
