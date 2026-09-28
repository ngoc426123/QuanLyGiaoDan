import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { runInTransaction } from '#/repositories/query-helpers.ts'
import * as suggestionRepository from '#/repositories/suggestion.repository.ts'
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

const NOT_FOUND = 'Không tìm thấy giá trị gợi ý'
const LABELS = Object.freeze({
  holy_name: 'tên thánh',
  birth_place: 'nơi sinh',
  parish: 'giáo xứ',
  priest: 'linh mục',
  diocese: 'giáo phận',
})

function normalizeValue(value) {
  return requireText(normalizeText(value, 120), 'value', 'Giá trị gợi ý không được để trống')
}

export function list(filter: any = {}) {
  const search = normalizeText(filter.search)
  const criteria = { ...filter, search: search ? toAscii(search) : undefined }
  return {
    data: suggestionRepository.findMany(criteria),
    meta: pageMeta(suggestionRepository.count(criteria), criteria),
  }
}

function assertAvailable(category, value, exceptId?) {
  if (suggestionRepository.findByValue(category, toAscii(value), exceptId)) {
    throw new AppError(ERROR_CODES.CONFLICT, `Giá trị ${LABELS[category]} này đã tồn tại`, {
      fieldErrors: { value: `Giá trị ${LABELS[category]} này đã tồn tại` },
    })
  }
}

export function create({ category, value, sortOrder = 0 }: any) {
  const normalized = normalizeValue(value)
  const timestamp = now()
  return runInTransaction(() => {
    assertAvailable(category, normalized)
    return suggestionRepository.insert({
      id: newId(),
      category,
      value: normalized,
      valueAscii: toAscii(normalized),
      sortOrder,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  })
}

export function update({ id, expectedUpdatedAt, patch }: any) {
  const normalized: any = {}
  if (Object.hasOwn(patch, 'value')) {
    normalized.value = normalizeValue(patch.value)
    normalized.valueAscii = toAscii(normalized.value)
  }
  if (Object.hasOwn(patch, 'sortOrder')) normalized.sortOrder = patch.sortOrder
  const timestamp = now()
  return runInTransaction(() => {
    const current = assertFound(suggestionRepository.findById(id), NOT_FOUND)
    assertVersion(current, expectedUpdatedAt)
    if (normalized.value) assertAvailable(current.category, normalized.value, id)
    return assertFound(suggestionRepository.update(id, normalized, timestamp), NOT_FOUND)
  })
}

export function remove({ id }: any) {
  const timestamp = now()
  return runInTransaction(() => {
    suggestionRepository.softDelete(id, timestamp)
    return { id }
  })
}
