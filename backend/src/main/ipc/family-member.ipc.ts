import { CHANNELS } from '@shared/channels.ts'
import { CHANGE_ACTIONS } from '@shared/constants.ts'
import {
  familyMemberAddSchema,
  familyMemberMoveSchema,
  familyMemberRemoveSchema,
  familyMemberUpdateSchema,
} from '#/schemas/family-member.schema.ts'
import * as familyMemberService from '#/services/family-member.service.ts'

/**
 * Handler nhóm `family-member:*`.
 *
 * Bảng này **không có sự kiện riêng**: mọi thay đổi thành viên hộ phát
 * `event:person-changed` kèm `familyId`, vì màn hình nào quan tâm tới thành viên cũng
 * đang hiển thị người (`project/ipc-channels.md` §3).
 */

const personChanged = (action) => (data) => ({
  channel: CHANNELS.EVENTS.PERSON_CHANGED,
  payload: { action, id: data.personId, familyId: data.familyId ?? null },
})

export const familyMemberHandlers = Object.freeze([
  {
    channel: CHANNELS.FAMILY_MEMBER.ADD,
    schema: familyMemberAddSchema,
    handle: (input) => familyMemberService.add(input),
    event: personChanged(CHANGE_ACTIONS.CREATED),
  },
  {
    channel: CHANNELS.FAMILY_MEMBER.UPDATE,
    schema: familyMemberUpdateSchema,
    handle: (input) => familyMemberService.update(input),
    event: personChanged(CHANGE_ACTIONS.UPDATED),
  },
  {
    // Chuyển hộ chạm hai hộ, nên payload mang cả hộ cũ để Renderer invalidate đủ.
    channel: CHANNELS.FAMILY_MEMBER.MOVE,
    schema: familyMemberMoveSchema,
    handle: (input) => familyMemberService.move(input),
    event: ({ closed, opened }) => ({
      channel: CHANNELS.EVENTS.PERSON_CHANGED,
      payload: {
        action: CHANGE_ACTIONS.MOVED,
        id: opened.personId,
        familyId: opened.familyId,
        previousFamilyId: closed ? closed.familyId : null,
      },
    }),
  },
  {
    channel: CHANNELS.FAMILY_MEMBER.REMOVE,
    schema: familyMemberRemoveSchema,
    handle: (input) => familyMemberService.remove(input),
    event: (data) =>
      data.personId
        ? {
            channel: CHANNELS.EVENTS.PERSON_CHANGED,
            payload: {
              action: CHANGE_ACTIONS.REMOVED,
              id: data.personId,
              familyId: data.familyId ?? null,
            },
          }
        : null,
  },
])
