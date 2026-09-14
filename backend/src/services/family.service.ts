import { AppError, ERROR_CODES } from '@shared/errors.ts'
import * as familyRepository from '#/repositories/family.repository.ts'
import * as familyMemberRepository from '#/repositories/family-member.repository.ts'
import { runInTransaction } from '#/repositories/query-helpers.ts'
import * as zoneRepository from '#/repositories/zone.repository.ts'
import { now } from './clock.ts'
import {
  assertFound,
  assertVersion,
  newId,
  normalizeText,
  pageMeta,
  requireText,
  toAscii,
} from './service-helpers.ts'

/** Nghiệp vụ của hộ gia đình (`families`). */

const NOT_FOUND_MESSAGE = 'Không tìm thấy hộ gia đình'

function normalizePatch(input: any) {
  const patch: any = {}

  if (Object.hasOwn(input, 'zoneId')) patch.zoneId = input.zoneId
  if (Object.hasOwn(input, 'name')) {
    patch.name = requireText(normalizeText(input.name, 120), 'name', 'Tên hộ không được để trống')

    // Cột bỏ dấu phục vụ sắp xếp và tìm kiếm — database-conventions.md §1.2c.
    patch.nameAscii = toAscii(patch.name)
  }
  if (Object.hasOwn(input, 'address')) patch.address = normalizeText(input.address, 255)
  if (Object.hasOwn(input, 'note')) patch.note = normalizeText(input.note)

  return patch
}

/** Giáo họ phải tồn tại — bắt trước để báo bằng tiếng Việt thay vì để khoá ngoại ném. */
function assertZoneExists(zoneId) {
  if (zoneRepository.exists(zoneId)) return

  throw new AppError(ERROR_CODES.FOREIGN_KEY_VIOLATION, 'Giáo họ được chọn không còn tồn tại', {
    fieldErrors: { zoneId: 'Giáo họ được chọn không còn tồn tại' },
  })
}

export function list(filter: any = {}) {
  const search = normalizeText(filter.search)
  const criteria = { ...filter, search: search ? toAscii(search) : undefined }

  return {
    data: familyRepository.findMany(criteria),
    meta: pageMeta(familyRepository.count(criteria), criteria),
  }
}

/** Kèm thành viên hiện hành và lịch sử để màn hình chi tiết hộ không tạo truy vấn N+1. */
export function getById(id) {
  const family = assertFound(familyRepository.findById(id), NOT_FOUND_MESSAGE)

  const memberships = familyMemberRepository.findByFamilyId(id, { includeHistory: true })
  return {
    ...family,
    members: memberships.filter((member) => member.isCurrent),
    membershipHistory: memberships.filter((member) => !member.isCurrent),
  }
}

export function create(input: any) {
  const patch = normalizePatch(input)
  const timestamp = now()

  return runInTransaction(() => {
    assertZoneExists(patch.zoneId)

    return familyRepository.insert({
      id: newId(),
      zoneId: patch.zoneId,
      name: patch.name,
      nameAscii: patch.nameAscii,
      address: patch.address ?? null,
      note: patch.note ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  })
}

export function update({ id, expectedUpdatedAt, patch }: any) {
  const normalized = normalizePatch(patch)
  const timestamp = now()

  return runInTransaction(() => {
    const current = assertFound(familyRepository.findRawById(id), NOT_FOUND_MESSAGE)
    assertVersion(current, expectedUpdatedAt)

    if (normalized.zoneId) assertZoneExists(normalized.zoneId)

    return assertFound(familyRepository.update(id, normalized, timestamp), NOT_FOUND_MESSAGE)
  })
}

/**
 * Hộ còn thành viên hiện hành thì **chặn** — `CONFLICT` kèm số thành viên để UI nói rõ
 * phải chuyển bao nhiêu người đi trước (`project/database-schema.md` §3).
 */
export function remove({ id }: any) {
  const timestamp = now()

  return runInTransaction(() => {
    const family = familyRepository.findRawById(id)
    if (!family) return { id }

    const memberCount = familyRepository.countMembers(id)

    if (memberCount > 0) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        'Không xoá được hộ vì vẫn còn ' +
          memberCount +
          ' thành viên. Hãy chuyển những người này sang hộ khác trước.',
        { memberCount },
      )
    }

    familyRepository.softDelete(id, timestamp)

    return { id, zoneId: family.zoneId }
  })
}

export function bulkMove({ ids, zoneId }: any) {
  const timestamp = now()
  return runInTransaction(() => {
    assertZoneExists(zoneId)
    if (familyRepository.countActiveByIds(ids) !== ids.length) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Có hộ gia đình đã không còn tồn tại')
    }
    return { count: familyRepository.updateZoneMany(ids, zoneId, timestamp), zoneId }
  })
}

export function bulkRemove({ ids }: any) {
  const timestamp = now()
  return runInTransaction(() => {
    if (familyRepository.countActiveByIds(ids) !== ids.length) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Có hộ gia đình đã không còn tồn tại')
    }
    const memberCount = familyRepository.countCurrentMembersByIds(ids)
    if (memberCount > 0) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        `Không xoá được vì ${memberCount} thành viên vẫn thuộc các hộ đã chọn`,
        { memberCount },
      )
    }
    return { count: familyRepository.softDeleteMany(ids, timestamp) }
  })
}
