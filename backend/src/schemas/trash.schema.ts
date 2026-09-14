import { z } from 'zod'
import { idSchema } from './common.schema.ts'

const typeSchema = z.enum(['zone', 'family', 'person'], { error: 'Loại bản ghi không hợp lệ' })

export const trashListSchema = z.undefined({ error: 'Không nhận tham số' })
export const trashRecordSchema = z.object({ type: typeSchema, id: idSchema }).strict()
export const trashEmptySchema = z.undefined({ error: 'Không nhận tham số' })
