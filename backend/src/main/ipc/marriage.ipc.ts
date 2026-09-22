import { CHANNELS } from '@shared/channels.ts'
import {
  marriageCreateSchema,
  marriageListSchema,
  marriageRemoveSchema,
  marriageUpdateSchema,
} from '#/schemas/marriage.schema.ts'
import * as marriageService from '#/services/marriage.service.ts'

const changed = (action) => (data) => ({
  channel: CHANNELS.EVENTS.MARRIAGE_CHANGED,
  payload: { action, id: data.id },
})

export const marriageHandlers = Object.freeze([
  {
    channel: CHANNELS.MARRIAGE.LIST,
    schema: marriageListSchema,
    handle: marriageService.list,
    withMeta: true,
  },
  {
    channel: CHANNELS.MARRIAGE.CREATE,
    schema: marriageCreateSchema,
    handle: marriageService.create,
    event: changed('created'),
  },
  {
    channel: CHANNELS.MARRIAGE.UPDATE,
    schema: marriageUpdateSchema,
    handle: marriageService.update,
    event: changed('updated'),
  },
  {
    channel: CHANNELS.MARRIAGE.REMOVE,
    schema: marriageRemoveSchema,
    handle: marriageService.remove,
    event: changed('removed'),
  },
])
