import { CHANNELS } from '@shared/channels.ts'
import { CHANGE_ACTIONS } from '@shared/constants.ts'
import {
  familyCreateSchema,
  familyBulkMoveSchema,
  familyBulkRemoveSchema,
  familyGetByIdSchema,
  familyListSchema,
  familyRemoveSchema,
  familyUpdateSchema,
} from '#/schemas/family.schema.ts'
import * as familyService from '#/services/family.service.ts'

/** Handler nhóm `family:*`. */

const changed = (action) => (data) => ({
  channel: CHANNELS.EVENTS.FAMILY_CHANGED,
  payload: { action, id: data.id, zoneId: data.zoneId ?? null },
})

export const familyHandlers = Object.freeze([
  {
    channel: CHANNELS.FAMILY.LIST,
    schema: familyListSchema,
    handle: (input) => familyService.list(input),
    withMeta: true,
  },
  {
    channel: CHANNELS.FAMILY.GET_BY_ID,
    schema: familyGetByIdSchema,
    handle: ({ id }) => familyService.getById(id),
  },
  {
    channel: CHANNELS.FAMILY.CREATE,
    schema: familyCreateSchema,
    handle: (input) => familyService.create(input),
    event: changed(CHANGE_ACTIONS.CREATED),
  },
  {
    channel: CHANNELS.FAMILY.UPDATE,
    schema: familyUpdateSchema,
    handle: (input) => familyService.update(input),
    event: changed(CHANGE_ACTIONS.UPDATED),
  },
  {
    channel: CHANNELS.FAMILY.REMOVE,
    schema: familyRemoveSchema,
    handle: (input) => familyService.remove(input),
    event: changed(CHANGE_ACTIONS.REMOVED),
  },
  {
    channel: CHANNELS.FAMILY.BULK_MOVE,
    schema: familyBulkMoveSchema,
    handle: (input) => familyService.bulkMove(input),
    event: () => ({ channel: CHANNELS.EVENTS.FAMILY_CHANGED, payload: { action: 'bulkMoved' } }),
  },
  {
    channel: CHANNELS.FAMILY.BULK_REMOVE,
    schema: familyBulkRemoveSchema,
    handle: (input) => familyService.bulkRemove(input),
    event: () => ({ channel: CHANNELS.EVENTS.FAMILY_CHANGED, payload: { action: 'bulkRemoved' } }),
  },
])
