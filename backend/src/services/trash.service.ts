import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { runInTransaction } from '#/repositories/query-helpers.ts'
import * as trashRepository from '#/repositories/trash.repository.ts'
import { now } from './clock.ts'

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
    return { ...input, restored: trashRepository.restore(input.type, input.id, now()) }
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
