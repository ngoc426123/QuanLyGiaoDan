import { CHANNELS } from '@shared/channels.ts'
import { CHANGE_ACTIONS } from '@shared/constants.ts'
import {
  zoneCreateSchema,
  zoneBulkRemoveSchema,
  zoneGetByIdSchema,
  zoneListSchema,
  zoneRemoveSchema,
  zoneUpdateSchema,
} from '#/schemas/zone.schema.ts'
import * as zoneService from '#/services/zone.service.ts'

/** Handler nhóm `zone:*`. Không chứa nghiệp vụ — chỉ validate, gọi Service, phát sự kiện. */

const changed = (action) => (data) => ({
  channel: CHANNELS.EVENTS.ZONE_CHANGED,
  payload: { action, id: data.id },
})

export const zoneHandlers = Object.freeze([
  {
    channel: CHANNELS.ZONE.LIST,
    schema: zoneListSchema,
    handle: (input) => zoneService.list(input),
    withMeta: true,
  },
  {
    channel: CHANNELS.ZONE.GET_BY_ID,
    schema: zoneGetByIdSchema,
    handle: ({ id }) => zoneService.getById(id),
  },
  {
    channel: CHANNELS.ZONE.CREATE,
    schema: zoneCreateSchema,
    handle: (input) => zoneService.create(input),
    event: changed(CHANGE_ACTIONS.CREATED),
  },
  {
    channel: CHANNELS.ZONE.UPDATE,
    schema: zoneUpdateSchema,
    handle: (input) => zoneService.update(input),
    event: changed(CHANGE_ACTIONS.UPDATED),
  },
  {
    channel: CHANNELS.ZONE.REMOVE,
    schema: zoneRemoveSchema,
    handle: (input) => zoneService.remove(input),
    event: changed(CHANGE_ACTIONS.REMOVED),
  },
  {
    channel: CHANNELS.ZONE.BULK_REMOVE,
    schema: zoneBulkRemoveSchema,
    handle: (input) => zoneService.bulkRemove(input),
    event: () => ({ channel: CHANNELS.EVENTS.ZONE_CHANGED, payload: { action: 'bulkRemoved' } }),
  },
])
