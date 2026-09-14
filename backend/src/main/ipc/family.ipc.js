import { CHANNELS } from '@shared/channels.js'
import { CHANGE_ACTIONS } from '@shared/constants.js'
import {
  familyCreateSchema,
  familyGetByIdSchema,
  familyListSchema,
  familyRemoveSchema,
  familyUpdateSchema,
} from '#/schemas/family.schema.js'
import * as familyService from '#/services/family.service.js'

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
])
