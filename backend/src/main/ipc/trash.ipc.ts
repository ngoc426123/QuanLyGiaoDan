import { CHANNELS } from '@shared/channels.ts'
import { trashEmptySchema, trashListSchema, trashRecordSchema } from '#/schemas/trash.schema.ts'
import * as trashService from '#/services/trash.service.ts'

export const trashHandlers = Object.freeze([
  { channel: CHANNELS.TRASH.LIST, schema: trashListSchema, handle: () => trashService.list() },
  {
    channel: CHANNELS.TRASH.RESTORE,
    schema: trashRecordSchema,
    handle: trashService.restore,
    event: (data) => ({
      channel:
        data.type === 'marriage'
          ? CHANNELS.EVENTS.MARRIAGE_CHANGED
          : CHANNELS.EVENTS.PERSON_CHANGED,
      payload: { action: 'restored', id: data.id },
    }),
  },
  {
    channel: CHANNELS.TRASH.HARD_REMOVE,
    schema: trashRecordSchema,
    handle: trashService.hardRemove,
    event: (data) => ({
      channel:
        data.type === 'marriage'
          ? CHANNELS.EVENTS.MARRIAGE_CHANGED
          : CHANNELS.EVENTS.PERSON_CHANGED,
      payload: { action: 'hardRemoved', id: data.id },
    }),
  },
  {
    channel: CHANNELS.TRASH.EMPTY,
    schema: trashEmptySchema,
    handle: trashService.empty,
    event: () => ({ channel: CHANNELS.EVENTS.PERSON_CHANGED, payload: { action: 'emptied' } }),
  },
])
