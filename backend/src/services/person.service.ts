import * as familyMemberRepository from '#/repositories/family-member.repository.ts'
import { record as recordActivity } from './activity-log.service.ts'
import * as familyRepository from '#/repositories/family.repository.ts'
import * as personRepository from '#/repositories/person.repository.ts'
import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { runInTransaction } from '#/repositories/query-helpers.ts'
import { now } from './clock.ts'
import { openMembership } from './family-member.service.ts'
import {
  assertFound,
  assertVersion,
  fieldError,
  isBefore,
  newId,
  normalizeText,
  pageMeta,
  requireText,
  toAscii,
} from './service-helpers.ts'

/** Nghiệp vụ của giáo dân (`persons`). */

const NOT_FOUND_MESSAGE = 'Không tìm thấy giáo dân'

/** Ngày bí tích: tên trường ↔ nhãn tiếng Việt dùng trong thông điệp lỗi. */
const SACRAMENT_DATES = Object.freeze([
  ['baptismDate', 'Ngày rửa tội'],
  ['firstCommunionDate', 'Ngày rước lễ lần đầu'],
  ['confirmationDate', 'Ngày thêm sức'],
  ['marriageDate', 'Ngày hôn phối'],
])

const TEXT_FIELDS = Object.freeze([
  ['fullName', 120],
  ['givenName', 50],
  ['holyName', 75],
  ['phone', 20],
  ['note', undefined],
])

const DATE_FIELDS = Object.freeze([
  'birthDate',
  'baptismDate',
  'firstCommunionDate',
  'confirmationDate',
  'marriageDate',
  'deathDate',
])

/**
 * Chuẩn hoá payload. `fullNameAscii` **luôn** do Service sinh lại từ `fullName` mỗi lần ghi —
 * Renderer không gửi cột này (`project/database-schema.md` §2.3).
 */
function normalizePatch(input: any) {
  const patch: any = {}

  for (const [field, maxLength] of TEXT_FIELDS) {
    if (Object.hasOwn(input, field)) patch[field] = normalizeText(input[field], Number(maxLength))
  }

  if (Object.hasOwn(patch, 'fullName')) {
    patch.fullName = requireText(patch.fullName, 'fullName', 'Họ và tên không được để trống')
    patch.fullNameAscii = toAscii(patch.fullName)
  }

  // Cột không dấu của tên gọi phục vụ sắp xếp: collation BINARY của SQLite xếp "Bé"
  // trước "Ánh", nên sắp trên cột có dấu là sai bảng chữ cái tiếng Việt.
  if (Object.hasOwn(patch, 'givenName')) {
    patch.givenNameAscii = patch.givenName === null ? null : toAscii(patch.givenName)
  }

  if (Object.hasOwn(input, 'gender')) patch.gender = input.gender ?? null

  for (const field of DATE_FIELDS) {
    if (Object.hasOwn(input, field)) patch[field] = input[field] ?? null
  }

  return patch
}

/**
 * Ràng buộc ngày tháng — `project/database-schema.md` §2.3.
 *
 * Vi phạm thứ tự sinh–tử là **chặn**; thứ tự tự nhiên giữa các bí tích chỉ **cảnh báo**,
 * vì sổ sách cũ hay thiếu và sai lệch, chặn cứng sẽ làm không nhập nổi dữ liệu thật.
 *
 * @param {object} record Bản ghi sau khi đã gộp patch vào dữ liệu hiện có
 * @returns {string[]} Danh sách cảnh báo, trả về Renderer qua `meta.warnings`
 */
function validateDates(record) {
  const { birthDate, deathDate } = record

  if (isBefore(deathDate, birthDate)) {
    throw fieldError('deathDate', 'Ngày qua đời không được trước ngày sinh')
  }

  for (const [field, label] of SACRAMENT_DATES) {
    if (isBefore(record[field], birthDate)) {
      throw fieldError(field, label + ' không được trước ngày sinh')
    }

    if (isBefore(deathDate, record[field])) {
      throw fieldError(field, label + ' không được sau ngày qua đời')
    }
  }

  const warnings = []

  if (isBefore(record.firstCommunionDate, record.baptismDate)) {
    warnings.push('Ngày rước lễ lần đầu đang trước ngày rửa tội')
  }

  if (isBefore(record.confirmationDate, record.firstCommunionDate)) {
    warnings.push('Ngày thêm sức đang trước ngày rước lễ lần đầu')
  }

  return warnings
}

function withMeta(data, warnings) {
  return warnings.length > 0 ? { data, meta: { warnings } } : { data }
}

export function list(filter: any = {}) {
  // Từ khoá tìm kiếm phải bỏ dấu giống hệt cách sinh `full_name_ascii`, nếu không sẽ
  // không bao giờ khớp.
  const search = normalizeText(filter.search)
  const criteria = { ...filter, search: search ? toAscii(search) : undefined }

  return {
    data: personRepository.findMany(criteria),
    meta: pageMeta(personRepository.count(criteria), criteria),
  }
}

/** Kèm hộ hiện hành và lịch sử hộ — `project/ipc-channels.md` §1.3. */
export function getById(id) {
  const person = assertFound(personRepository.findById(id), NOT_FOUND_MESSAGE)

  return {
    ...person,
    currentMembership: familyMemberRepository.findCurrentByPersonId(id),
    membershipHistory: familyMemberRepository.findHistoryByPersonId(id),
  }
}

/**
 * Tạo người, tuỳ chọn gán luôn vào hộ — **một transaction**. Bỏ trống `family` thì tạo
 * người chưa thuộc hộ nào.
 */
export function create(input: any) {
  const patch = normalizePatch(input)
  const warnings = validateDates(patch)
  const timestamp = now()

  const person = runInTransaction(() => {
    const created = personRepository.insert({
      id: newId(),
      fullName: patch.fullName,
      givenName: patch.givenName ?? null,
      fullNameAscii: patch.fullNameAscii,
      givenNameAscii: patch.givenNameAscii ?? null,
      holyName: patch.holyName ?? null,
      gender: patch.gender ?? null,
      birthDate: patch.birthDate ?? null,
      baptismDate: patch.baptismDate ?? null,
      firstCommunionDate: patch.firstCommunionDate ?? null,
      confirmationDate: patch.confirmationDate ?? null,
      marriageDate: patch.marriageDate ?? null,
      deathDate: patch.deathDate ?? null,
      phone: patch.phone ?? null,
      note: patch.note ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    if (input.family) {
      const membership = openMembership({ ...input.family, personId: created.id }, timestamp)
      recordActivity({
        entityType: 'family_member',
        entityId: membership.id,
        action: 'created',
        timestamp,
      })
    }

    const person = personRepository.findById(created.id)
    recordActivity({ entityType: 'person', entityId: created.id, action: 'created', timestamp })
    return person
  })

  return withMeta(person, warnings)
}

export function update({ id, expectedUpdatedAt, patch }: any) {
  const normalized = normalizePatch(patch)
  const timestamp = now()
  let warnings = []

  const person = runInTransaction(() => {
    const current = assertFound(personRepository.findRawById(id), NOT_FOUND_MESSAGE)
    assertVersion(current, expectedUpdatedAt)

    // Kiểm tra ngày trên bản ghi **sau khi gộp**: sửa mỗi ngày sinh vẫn phải đối chiếu
    // với các ngày bí tích đang có sẵn trong DB.
    warnings = validateDates({ ...current, ...normalized })

    const updated = assertFound(
      personRepository.update(id, normalized, timestamp),
      NOT_FOUND_MESSAGE,
    )
    recordActivity({
      entityType: 'person',
      entityId: id,
      action: 'updated',
      before: current,
      after: updated,
      timestamp,
    })
    return updated
  })

  return withMeta(person, warnings)
}

/**
 * Xoá mềm người **và** dòng `family_members` hiện hành của họ, trong cùng một transaction
 * (`project/database-schema.md` §3). Idempotent.
 */
export function remove({ id }: any) {
  const timestamp = now()

  return runInTransaction(() => {
    const person = personRepository.findRawById(id)
    if (!person) return { id }

    const membership = familyMemberRepository.findCurrentByPersonId(id)

    familyMemberRepository.softDeleteCurrentByPersonId(id, timestamp)
    personRepository.softDelete(id, timestamp)
    if (membership) {
      recordActivity({
        entityType: 'family_member',
        entityId: membership.id,
        action: 'removed',
        timestamp,
      })
    }
    recordActivity({ entityType: 'person', entityId: id, action: 'removed', timestamp })

    return { id, familyId: membership ? membership.familyId : null }
  })
}

export function bulkMove({ ids, familyId, relationship, moveDate }: any) {
  const timestamp = now()
  return runInTransaction(() => {
    if (!familyRepository.exists(familyId)) {
      throw fieldError('familyId', 'Hộ gia đình được chọn không còn tồn tại')
    }
    if (personRepository.countActiveByIds(ids) !== ids.length) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Có giáo dân đã không còn tồn tại')
    }
    if (relationship === 'head' && ids.length > 1) {
      throw fieldError('relationship', 'Chỉ có thể chuyển một người làm chủ hộ mỗi lần')
    }
    const currentHead = familyMemberRepository.findCurrentHeadByFamilyId(familyId)
    if (relationship === 'head' && currentHead && currentHead.personId !== ids[0]) {
      throw fieldError('relationship', 'Hộ được chọn đã có chủ hộ')
    }
    const memberships = familyMemberRepository.findCurrentByPersonIds(ids)
    if (memberships.some((member: any) => isBefore(moveDate, member.from_date))) {
      throw fieldError('moveDate', 'Ngày chuyển hộ không được trước ngày vào hộ cũ')
    }
    familyMemberRepository.closeCurrentByPersonIds(ids, moveDate, timestamp)
    familyMemberRepository.insertMany(
      ids.map((personId: string) => ({
        id: newId(),
        familyId,
        personId,
        relationship,
        fromDate: moveDate,
        toDate: null,
        note: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    )
    for (const membership of memberships) {
      recordActivity({
        entityType: 'family_member',
        entityId: membership.id,
        action: 'updated',
        timestamp,
      })
    }
    for (const personId of ids) {
      recordActivity({ entityType: 'person', entityId: personId, action: 'updated', timestamp })
    }
    return { count: ids.length, familyId }
  })
}

export function bulkRemove({ ids }: any) {
  const timestamp = now()
  return runInTransaction(() => {
    if (personRepository.countActiveByIds(ids) !== ids.length) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Có giáo dân đã không còn tồn tại')
    }
    const memberships = familyMemberRepository.findCurrentByPersonIds(ids)
    familyMemberRepository.softDeleteCurrentByPersonIds(ids, timestamp)
    const count = personRepository.softDeleteMany(ids, timestamp)
    for (const membership of memberships) {
      recordActivity({
        entityType: 'family_member',
        entityId: membership.id,
        action: 'removed',
        timestamp,
      })
    }
    for (const personId of ids)
      recordActivity({ entityType: 'person', entityId: personId, action: 'removed', timestamp })
    return { count }
  })
}
