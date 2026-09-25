import * as marriageRepository from '#/repositories/marriage.repository.ts'
import * as personRepository from '#/repositories/person.repository.ts'
import * as sacramentRepository from '#/repositories/sacrament.repository.ts'
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
  toAscii,
} from './service-helpers.ts'

const NOT_FOUND_MESSAGE = 'Không tìm thấy hôn phối'

function normalize(input) {
  return {
    personId: input.personId,
    spouseId: input.spouseId || null,
    spouseName: normalizeText(input.spouseName, 120),
    spouseHolyName: normalizeText(input.spouseHolyName, 75),
    spouseBirthDate: input.spouseBirthDate || null,
    spouseParishName: normalizeText(input.spouseParishName, 120),
    spouseDioceseName: normalizeText(input.spouseDioceseName, 120),
    spouseBaptismDate: input.spouseBaptismDate || null,
    spouseBaptismPlace: normalizeText(input.spouseBaptismPlace, 255),
    spouseConfirmationDate: input.spouseConfirmationDate || null,
    spouseConfirmationPlace: normalizeText(input.spouseConfirmationPlace, 255),
    spouseFatherName: normalizeText(input.spouseFatherName, 120),
    spouseMotherName: normalizeText(input.spouseMotherName, 120),
    date: input.date,
    minister: normalizeText(input.minister, 120),
    place: normalizeText(input.place, 255),
    status: input.status ?? 'married',
    note: normalizeText(input.note, 1000),
    witnessOne: normalizeText(input.witnessOne, 120),
    witnessTwo: normalizeText(input.witnessTwo, 120),
  }
}

function participants(input, timestamp) {
  if (!input.spouseId && !input.spouseName) {
    throw fieldError('spouseName', 'Hãy chọn giáo dân hoặc nhập người phối ngẫu ngoài giáo xứ')
  }
  if (input.personId === input.spouseId) throw fieldError('spouseId', 'Hai đương sự phải khác nhau')
  const person = assertFound(
    personRepository.findRawById(input.personId),
    'Giáo dân được chọn không còn tồn tại',
  )
  const records = [person]
  if (input.spouseId) {
    records.push(
      assertFound(
        personRepository.findRawById(input.spouseId),
        'Người phối ngẫu không còn tồn tại',
      ),
    )
  }
  for (const current of records) {
    if (isBefore(input.date, current.birthDate) || isBefore(current.deathDate, input.date)) {
      throw fieldError('date', 'Ngày hôn phối không phù hợp với hồ sơ đương sự')
    }
  }
  const internal = {
    id: newId(),
    personId: person.id,
    fullName: person.fullName,
    fullNameAscii: person.fullNameAscii,
    isExternal: false,
    holyName: person.holyName,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  if (input.spouseId) {
    const spouse = records[1]
    return [
      internal,
      {
        id: newId(),
        personId: spouse.id,
        fullName: spouse.fullName,
        fullNameAscii: spouse.fullNameAscii,
        isExternal: false,
        holyName: spouse.holyName,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]
  }
  return [
    internal,
    {
      id: newId(),
      personId: null,
      fullName: input.spouseName,
      fullNameAscii: toAscii(input.spouseName),
      isExternal: true,
      holyName: input.spouseHolyName,
      birthDate: input.spouseBirthDate,
      parishName: input.spouseParishName,
      dioceseName: input.spouseDioceseName,
      baptismDate: input.spouseBaptismDate,
      baptismPlace: input.spouseBaptismPlace,
      confirmationDate: input.spouseConfirmationDate,
      confirmationPlace: input.spouseConfirmationPlace,
      fatherName: input.spouseFatherName,
      motherName: input.spouseMotherName,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
}

function createExternalSpouse(value, timestamp) {
  const external = personRepository.insert({
    id: newId(),
    fullName: value.spouseName,
    fullNameAscii: toAscii(value.spouseName),
    givenName: null,
    givenNameAscii: null,
    holyName: value.spouseHolyName,
    gender: null,
    birthDate: value.spouseBirthDate,
    deathDate: null,
    phone: null,
    email: null,
    occupation: null,
    secondaryPhone: null,
    residenceStatus: null,
    pastoralStatus: null,
    pastoralNote: null,
    source: 'transferred',
    note: null,
    personType: 'external',
    parishName: value.spouseParishName,
    dioceseName: value.spouseDioceseName,
    fatherName: value.spouseFatherName,
    motherName: value.spouseMotherName,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  for (const row of [
    { type: 'baptism', date: value.spouseBaptismDate, place: value.spouseBaptismPlace },
    {
      type: 'confirmation',
      date: value.spouseConfirmationDate,
      place: value.spouseConfirmationPlace,
    },
  ]) {
    if (row.date)
      sacramentRepository.insert({
        id: newId(),
        personId: external.id,
        ...row,
        minister: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
  }
  return external
}

export function list(filter: any = {}) {
  const search = normalizeText(filter.search)
  const criteria = { ...filter, search: search ? toAscii(search) : undefined }
  return {
    data: marriageRepository.findMany(criteria),
    meta: pageMeta(marriageRepository.count(criteria), criteria),
  }
}

export function create(input) {
  const value = normalize(input)
  const timestamp = now()
  return runInTransaction(() => {
    if (!value.spouseId) {
      value.spouseId = createExternalSpouse(value, timestamp).id
    }
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
    if (!value.spouseId) value.spouseId = createExternalSpouse(value, timestamp).id
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
