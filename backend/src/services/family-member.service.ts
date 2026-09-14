import { AppError, ERROR_CODES } from '@shared/errors.ts'
import * as familyRepository from '#/repositories/family.repository.ts'
import * as familyMemberRepository from '#/repositories/family-member.repository.ts'
import * as personRepository from '#/repositories/person.repository.ts'
import { runInTransaction } from '#/repositories/query-helpers.ts'
import { now } from './clock.ts'
import {
  assertFound,
  assertVersion,
  fieldError,
  isBefore,
  newId,
  normalizeText,
} from './service-helpers.ts'

/**
 * Nghiệp vụ quan hệ người–hộ (`family_members`).
 *
 * Hai ràng buộc xương sống (`project/database-schema.md` §2.4):
 * - Mỗi người **đúng một** hộ hiện hành
 * - Mỗi hộ **đúng một** chủ hộ đang tại vị
 *
 * DB đã có hai partial unique index cho cả hai, nhưng Service vẫn kiểm tra trước để trả
 * `CONFLICT` kèm thông điệp tiếng Việt dễ hiểu — DB là lưới an toàn cuối, không phải lớp đầu.
 */

const NOT_FOUND_MESSAGE = 'Không tìm thấy dòng thành viên'

function assertFamilyExists(familyId) {
  if (familyRepository.exists(familyId)) return

  throw new AppError(ERROR_CODES.FOREIGN_KEY_VIOLATION, 'Hộ gia đình được chọn không còn tồn tại', {
    fieldErrors: { familyId: 'Hộ gia đình được chọn không còn tồn tại' },
  })
}

function assertPersonExists(personId) {
  if (personRepository.exists(personId)) return

  throw new AppError(ERROR_CODES.FOREIGN_KEY_VIOLATION, 'Giáo dân được chọn không còn tồn tại', {
    fieldErrors: { personId: 'Giáo dân được chọn không còn tồn tại' },
  })
}

/** Chỉ một chủ hộ tại vị. Bỏ qua chính dòng đang sửa (`exceptId`). */
function assertHeadAvailable(familyId: any, relationship: any, exceptId?: any) {
  if (relationship !== 'head') return

  const head = familyMemberRepository.findCurrentHeadByFamilyId(familyId)
  if (!head || head.id === exceptId) return

  throw new AppError(
    ERROR_CODES.CONFLICT,
    'Hộ này đã có chủ hộ. Hãy đổi vai trò của chủ hộ hiện tại trước.',
    { currentHead: head, fieldErrors: { relationship: 'Hộ này đã có chủ hộ' } },
  )
}

/**
 * Mở một dòng thành viên hiện hành, kèm đủ kiểm tra tiền điều kiện.
 *
 * Dùng chung cho `family-member:add`, `family-member:move` và nhánh gán hộ của
 * `person:create` — **phải gọi bên trong transaction của bên gọi**.
 *
 * @param {{ familyId: string, personId: string, relationship: string, fromDate: string, note?: string }} input
 * @param {string} timestamp Mốc ISO UTC dùng cho `created_at` / `updated_at`
 * @param {{ skipCurrentCheck?: boolean }} [options] `move` đã tự đóng dòng cũ nên bỏ qua kiểm tra
 */
export function openMembership(input, timestamp, options: any = {}) {
  assertFamilyExists(input.familyId)
  assertPersonExists(input.personId)

  if (!options.skipCurrentCheck) {
    const current = familyMemberRepository.findCurrentByPersonId(input.personId)

    if (current) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        'Giáo dân này đang thuộc hộ "' +
          current.familyName +
          '". Hãy dùng chức năng chuyển hộ thay vì thêm mới.',
        { currentMembership: current },
      )
    }
  }

  assertHeadAvailable(input.familyId, input.relationship)

  return familyMemberRepository.insert({
    id: newId(),
    familyId: input.familyId,
    personId: input.personId,
    relationship: input.relationship,
    fromDate: input.fromDate,
    toDate: null,
    note: normalizeText(input.note),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

export function add(input: any) {
  const timestamp = now()

  return runInTransaction(() => openMembership(input, timestamp))
}

export function update({ id, expectedUpdatedAt, patch }: any) {
  const timestamp = now()

  const normalized: any = {}
  if (Object.hasOwn(patch, 'relationship')) normalized.relationship = patch.relationship
  if (Object.hasOwn(patch, 'note')) normalized.note = normalizeText(patch.note)

  return runInTransaction(() => {
    const current = assertFound(familyMemberRepository.findById(id), NOT_FOUND_MESSAGE)
    assertVersion(current, expectedUpdatedAt)

    if (normalized.relationship && current.isCurrent) {
      assertHeadAvailable(current.familyId, normalized.relationship, id)
    }

    return assertFound(familyMemberRepository.update(id, normalized, timestamp), NOT_FOUND_MESSAGE)
  })
}

/**
 * Chuyển hộ — **một** thao tác nghiệp vụ chạm hai dòng, làm trong **một** transaction.
 *
 * Tách thành `remove` + `add` sẽ để lại một khoảng thời gian người không thuộc hộ nào
 * (`project/ipc-channels.md` §1.4).
 */
export function move({ personId, toFamilyId, relationship, moveDate }: any) {
  const timestamp = now()

  return runInTransaction(() => {
    const current = familyMemberRepository.findCurrentByPersonId(personId)

    if (!current) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        'Giáo dân này chưa thuộc hộ nào. Hãy dùng chức năng thêm vào hộ.',
      )
    }

    if (current.familyId === toFamilyId) {
      throw new AppError(ERROR_CODES.CONFLICT, 'Giáo dân này đang ở sẵn trong hộ được chọn')
    }

    if (isBefore(moveDate, current.fromDate)) {
      throw fieldError('moveDate', 'Ngày chuyển hộ không được trước ngày vào hộ hiện tại')
    }

    assertFamilyExists(toFamilyId)

    // Đóng dòng cũ TRƯỚC khi mở dòng mới: `uq_family_members_current` chỉ cho phép đúng
    // một dòng `to_date IS NULL` cho mỗi người.
    familyMemberRepository.closeCurrent(personId, moveDate, timestamp)

    const opened = openMembership(
      { familyId: toFamilyId, personId, relationship, fromDate: moveDate },
      timestamp,
      { skipCurrentCheck: true },
    )

    return { closed: familyMemberRepository.findById(current.id), opened }
  })
}

/** Xoá mềm. Idempotent: xoá dòng đã xoá vẫn trả về thành công. */
export function remove({ id }: any) {
  const timestamp = now()

  return runInTransaction(() => {
    const member = familyMemberRepository.findById(id)
    if (!member) return { id }

    familyMemberRepository.softDelete(id, timestamp)

    return { id, familyId: member.familyId, personId: member.personId }
  })
}
