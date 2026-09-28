import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { runInTransaction } from '#/repositories/query-helpers.ts'
import * as trashRepository from '#/repositories/trash.repository.ts'
import { now } from './clock.ts'
import { record as recordActivity } from './activity-log.service.ts'
import * as personRepository from '#/repositories/person.repository.ts'
import * as familyMemberRepository from '#/repositories/family-member.repository.ts'

export function list() {
  return trashRepository.findMany().map((row: any) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    deletedAt: row.deleted_at,
  }))
}

export function restore(input: any) {
  return runInTransaction(() => {
    if (input.type === 'family') {
      const family = trashRepository.findDeletedFamily(input.id)
      if (family && !trashRepository.isLiveZone(family.zone_id)) {
        throw new AppError(ERROR_CODES.CONFLICT, 'Hãy khôi phục giáo họ của hộ này trước')
      }
    }
    if (input.type === 'family_member') {
      const member = trashRepository.findDeletedFamilyMember(input.id)
      if (
        member &&
        (!trashRepository.isLiveFamily(member.family_id) ||
          !trashRepository.isLivePerson(member.person_id))
      ) {
        throw new AppError(ERROR_CODES.CONFLICT, 'Hãy khôi phục giáo dân và hộ gia đình trước')
      }
      if (member?.to_date === null && trashRepository.hasCurrentMembership(member.person_id)) {
        throw new AppError(ERROR_CODES.CONFLICT, 'Giáo dân này đã thuộc một hộ khác')
      }
      if (
        member?.to_date === null &&
        member.relationship === 'head' &&
        trashRepository.hasCurrentHead(member.family_id)
      ) {
        throw new AppError(ERROR_CODES.CONFLICT, 'Hộ này đã có chủ hộ')
      }
    }
    if (input.type === 'marriage') {
      const participants = trashRepository.findDeletedMarriageParticipantIds(input.id)
      if (
        participants.some(
          (participant: any) => !trashRepository.isLivePerson(participant.person_id),
        )
      ) {
        throw new AppError(ERROR_CODES.CONFLICT, 'Hãy khôi phục các đương sự trước')
      }
    }
    const timestamp = now()
    const deletedPerson =
      input.type === 'person' ? personRepository.findDeletedAtById(input.id) : null
    const restored = trashRepository.restore(
      input.type,
      input.id,
      timestamp,
      deletedPerson?.deleted_at,
    )
    if (restored && deletedPerson?.deleted_at) {
      familyMemberRepository.restoreCurrentByPersonId(input.id, deletedPerson.deleted_at, timestamp)
    }
    if (restored)
      recordActivity({ entityType: input.type, entityId: input.id, action: 'restored', timestamp })
    return { ...input, restored }
  })
}

export function hardRemove(input: any) {
  return runInTransaction(() => ({
    ...input,
    removed: trashRepository.hardRemove(input.type, input.id),
  }))
}

export function empty() {
  return runInTransaction(() => ({ removed: trashRepository.empty() }))
}
