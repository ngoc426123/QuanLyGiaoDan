import { AppError, ERROR_CODES } from '@shared/errors.ts'
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

/**
 * Nghiệp vụ của giáo họ (`zones`).
 *
 * Khuôn mẫu mỗi phương thức — `data-services.md` §3.1: kiểm tra tiền điều kiện → chuẩn hoá
 * dữ liệu → thực thi (transaction nếu chạm nhiều lệnh ghi) → trả đối tượng domain đầy đủ.
 */

const NOT_FOUND_MESSAGE = 'Không tìm thấy giáo họ'

/** Chuẩn hoá payload tạo/sửa. Trả về đúng những trường có mặt trong `input`. */
function normalizePatch(input: any) {
  const patch: any = {}

  if (Object.hasOwn(input, 'name')) {
    patch.name = requireText(
      normalizeText(input.name, 100),
      'name',
      'Tên giáo họ không được để trống',
    )

    // Cột bỏ dấu phục vụ sắp xếp và tìm kiếm — database-conventions.md §1.2c.
    patch.nameAscii = toAscii(patch.name)
  }

  if (Object.hasOwn(input, 'holyName')) patch.holyName = normalizeText(input.holyName, 75)
  if (Object.hasOwn(input, 'note')) patch.note = normalizeText(input.note)

  return patch
}

/** Tên giáo họ là duy nhất trong số bản ghi còn sống — `uq_zones_name` là lưới an toàn cuối. */
function assertNameAvailable(name: any, exceptId?: any) {
  const existing = zoneRepository.findByName(name)

  if (existing && existing.id !== exceptId) {
    throw new AppError(ERROR_CODES.CONFLICT, 'Tên giáo họ này đã tồn tại', {
      fieldErrors: { name: 'Tên giáo họ này đã tồn tại' },
    })
  }
}

export function list(filter: any = {}) {
  // Từ khoá phải bỏ dấu giống hệt cách sinh `name_ascii`, nếu không sẽ không khớp.
  const search = normalizeText(filter.search)
  const criteria = { ...filter, search: search ? toAscii(search) : undefined }

  return {
    data: zoneRepository.findMany(criteria),
    meta: pageMeta(zoneRepository.count(criteria), criteria),
  }
}

export function getById(id) {
  const zone = assertFound(zoneRepository.findById(id), NOT_FOUND_MESSAGE)

  return { ...zone, ...zoneRepository.countFamiliesAndPersons(id) }
}

export function create(input: any) {
  const patch = normalizePatch({ name: input.name, holyName: input.holyName, note: input.note })
  const timestamp = now()

  return runInTransaction(() => {
    assertNameAvailable(patch.name)

    return zoneRepository.insert({
      id: newId(),
      name: patch.name,
      nameAscii: patch.nameAscii,
      holyName: patch.holyName ?? null,
      note: patch.note ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  })
}

/**
 * Đọc bản ghi, so `expectedUpdatedAt`, rồi ghi — cả ba **trong cùng một transaction**,
 * nếu không vẫn còn khe hở mất dữ liệu (`ipc-communication.md` §4b).
 */
export function update({ id, expectedUpdatedAt, patch }: any) {
  const normalized = normalizePatch(patch)
  const timestamp = now()

  return runInTransaction(() => {
    const current = assertFound(zoneRepository.findById(id), NOT_FOUND_MESSAGE)
    assertVersion(current, expectedUpdatedAt)

    if (normalized.name) assertNameAvailable(normalized.name, id)

    return assertFound(zoneRepository.update(id, normalized, timestamp), NOT_FOUND_MESSAGE)
  })
}

/**
 * Xoá mềm. **Idempotent**: xoá một id đã bị xoá vẫn trả về thành công
 * (`ipc-communication.md` §8).
 */
export function remove({ id }: any) {
  const timestamp = now()

  return runInTransaction(() => {
    const zone = zoneRepository.findById(id)
    if (!zone) return { id }

    const { familyCount } = zoneRepository.countFamiliesAndPersons(id)

    if (familyCount > 0) {
      throw new AppError(
        ERROR_CODES.FOREIGN_KEY_VIOLATION,
        'Không xoá được giáo họ vì vẫn còn ' +
          familyCount +
          ' hộ gia đình. Hãy chuyển các hộ này sang giáo họ khác trước.',
        { familyCount },
      )
    }

    zoneRepository.softDelete(id, timestamp)

    return { id }
  })
}

export function bulkRemove({ ids }: any) {
  const timestamp = now()
  return runInTransaction(() => {
    if (zoneRepository.countActiveByIds(ids) !== ids.length) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Có giáo họ đã không còn tồn tại')
    }
    const familyCount = zoneRepository.countFamiliesByZoneIds(ids)
    if (familyCount > 0) {
      throw new AppError(
        ERROR_CODES.FOREIGN_KEY_VIOLATION,
        `Không xoá được vì ${familyCount} hộ vẫn thuộc các giáo họ đã chọn`,
        { familyCount },
      )
    }
    return { count: zoneRepository.softDeleteMany(ids, timestamp) }
  })
}
