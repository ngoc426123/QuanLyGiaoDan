import { z } from 'zod'
import { idSchema } from './common.schema.ts'

export const activityLogListSchema = z
  .object({
    entityType: z.enum(['zone', 'family', 'person', 'family_member']),
    entityId: idSchema,
  })
  .strict()
