import { CHANNELS } from '@shared/channels.ts'
import {
  suggestionCreateSchema,
  suggestionListSchema,
  suggestionRemoveSchema,
  suggestionUpdateSchema,
} from '#/schemas/suggestion.schema.ts'
import * as suggestionService from '#/services/suggestion.service.ts'

export const suggestionHandlers = Object.freeze([
  {
    channel: CHANNELS.SUGGESTION.LIST,
    schema: suggestionListSchema,
    handle: (input) => suggestionService.list(input),
    withMeta: true,
  },
  {
    channel: CHANNELS.SUGGESTION.CREATE,
    schema: suggestionCreateSchema,
    handle: (input) => suggestionService.create(input),
    event: () => ({ channel: CHANNELS.EVENTS.SUGGESTION_CHANGED, payload: { action: 'created' } }),
  },
  {
    channel: CHANNELS.SUGGESTION.UPDATE,
    schema: suggestionUpdateSchema,
    handle: (input) => suggestionService.update(input),
    event: () => ({ channel: CHANNELS.EVENTS.SUGGESTION_CHANGED, payload: { action: 'updated' } }),
  },
  {
    channel: CHANNELS.SUGGESTION.REMOVE,
    schema: suggestionRemoveSchema,
    handle: (input) => suggestionService.remove(input),
    event: () => ({ channel: CHANNELS.EVENTS.SUGGESTION_CHANGED, payload: { action: 'removed' } }),
  },
])
