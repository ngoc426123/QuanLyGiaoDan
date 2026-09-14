import { CHANNELS } from '@shared/channels.ts'
import { searchQuerySchema } from '#/schemas/search.schema.ts'
import * as searchService from '#/services/search.service.ts'

export const searchHandlers = Object.freeze([
  {
    channel: CHANNELS.SEARCH.QUERY,
    schema: searchQuerySchema,
    handle: ({ query }) => searchService.query(query),
  },
])
