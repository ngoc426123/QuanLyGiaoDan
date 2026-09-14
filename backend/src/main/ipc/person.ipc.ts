import { CHANNELS } from '@shared/channels.ts'
import { CHANGE_ACTIONS } from '@shared/constants.ts'
import {
  personCreateSchema,
  personGetByIdSchema,
  personListSchema,
  personRemoveSchema,
  personUpdateSchema,
} from '#/schemas/person.schema.ts'
import * as personService from '#/services/person.service.ts'

/** Handler nhóm `person:*`. */

const changed = (action) => (data) => ({
  channel: CHANNELS.EVENTS.PERSON_CHANGED,
  payload: { action, id: data.id, familyId: data.familyId ?? null },
})

export const personHandlers = Object.freeze([
  {
    channel: CHANNELS.PERSON.LIST,
    schema: personListSchema,
    handle: (input) => personService.list(input),
    withMeta: true,
  },
  {
    channel: CHANNELS.PERSON.GET_BY_ID,
    schema: personGetByIdSchema,
    handle: ({ id }) => personService.getById(id),
  },
  {
    // `meta.warnings` mang cảnh báo thứ tự ngày bí tích — cảnh báo, không chặn.
    channel: CHANNELS.PERSON.CREATE,
    schema: personCreateSchema,
    handle: (input) => personService.create(input),
    withMeta: true,
    event: changed(CHANGE_ACTIONS.CREATED),
  },
  {
    channel: CHANNELS.PERSON.UPDATE,
    schema: personUpdateSchema,
    handle: (input) => personService.update(input),
    withMeta: true,
    event: changed(CHANGE_ACTIONS.UPDATED),
  },
  {
    channel: CHANNELS.PERSON.REMOVE,
    schema: personRemoveSchema,
    handle: (input) => personService.remove(input),
    event: changed(CHANGE_ACTIONS.REMOVED),
  },
])
