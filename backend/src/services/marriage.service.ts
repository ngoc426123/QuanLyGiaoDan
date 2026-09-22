import * as marriageRepository from '#/repositories/marriage.repository.ts'
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
  pageMeta,
} from './service-helpers.ts'

const NOT_FOUND_MESSAGE = 'Không tìm thấy hôn phối'

function normalize(input) {
  return {
    personId: input.personId,
    spouseId: input.spouseId,
    date: input.date,
    minister: normalizeText(input.minister, 120),
    place: normalizeText(input.place, 255),
  }
}

function participants(input, timestamp) {
  if (input.personId === input.spouseId) throw fieldError('spouseId', 'Hai đương sự phải khác nhau')
  const records = [input.personId, input.spouseId].map((id) =>
    assertFound(personRepository.findRawById(id), 'Giáo dân được chọn không còn tồn tại'),
  )
  for (const person of records) {
    if (isBefore(input.date, person.birthDate) || isBefore(person.deathDate, input.date)) {
      throw fieldError('date', 'Ngày hôn phối không phù hợp với hồ sơ đương sự')
    }
  }
  return records.map((person) => ({
    id: newId(),
    personId: person.id,
    fullName: person.fullName,
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
}

function assertAvailable(input, currentId?: string) {
  for (const personId of [input.personId, input.spouseId]) {
    const existing = marriageRepository.findByPersonId(personId)
    if (existing && existing.id !== currentId) {
      throw fieldError('personId', 'Một trong hai đương sự đã có thông tin hôn phối')
    }
  }
}

export function list(filter = {}) {
  return {
    data: marriageRepository.findMany(filter),
    meta: pageMeta(marriageRepository.count(), filter),
  }
}

export function create(input) {
  const value = normalize(input)
  const timestamp = now()
  return runInTransaction(() => {
    assertAvailable(value)
    const rows = participants(value, timestamp)
    const id = newId()
    marriageRepository.insert({ id, ...value, createdAt: timestamp, updatedAt: timestamp })
    marriageRepository.insertParticipants(rows.map((row) => ({ ...row, marriageId: id })))
    return marriageRepository.findById(id)
  })
}

export function update({ id, expectedUpdatedAt, patch }) {
  const value = normalize(patch)
  const timestamp = now()
  return runInTransaction(() => {
    const current = assertFound(marriageRepository.findById(id), NOT_FOUND_MESSAGE)
    assertVersion({ updatedAt: current.updated_at }, expectedUpdatedAt)
    assertAvailable(value, id)
    const rows = participants(value, timestamp)
    marriageRepository.update(id, value, timestamp)
    marriageRepository.replaceParticipants(
      id,
      rows.map((row) => ({ ...row, marriageId: id })),
      timestamp,
    )
    return marriageRepository.findById(id)
  })
}

export function remove({ id }) {
  return runInTransaction(() => {
    assertFound(marriageRepository.findById(id), NOT_FOUND_MESSAGE)
    marriageRepository.softDeleteById(id, now())
    return { id }
  })
}
