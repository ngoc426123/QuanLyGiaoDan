import { z } from 'zod'

export const searchQuerySchema = z.object({ query: z.string().trim().min(1).max(120) }).strict()
