import { CHANNELS } from '@shared/channels.ts'
import { trashEmptySchema, trashListSchema, trashRecordSchema } from '#/schemas/trash.schema.ts'
import * as trashService from '#/services/trash.service.ts'

export const trashHandlers = Object.freeze([
  { channel: CHANNELS.TRASH.LIST, schema: trashListSchema, handle: () => trashService.list() },
  {
    channel: CHANNELS.TRASH.RESTORE,
    schema: trashRecordSchema,
    handle: trashService.restore,
    event: () => ({ channel: CHANNELS.EVENTS.PERSON_CHANGED, payload: { action: 'restored' } }),
  },
  {
    channel: CHANNELS.TRASH.HARD_REMOVE,
    schema: trashRecordSchema,
    handle: trashService.hardRemove,
    event: () => ({ channel: CHANNELS.EVENTS.PERSON_CHANGED, payload: { action: 'hardRemoved' } }),
  },
  {
    channel: CHANNELS.TRASH.EMPTY,
    schema: trashEmptySchema,
    handle: trashService.empty,
    event: () => ({ channel: CHANNELS.EVENTS.PERSON_CHANGED, payload: { action: 'emptied' } }),
  },
])
