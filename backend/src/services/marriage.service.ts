import * as marriageRepository from '#/repositories/marriage.repository.ts'
import * as personRepository from '#/repositories/person.repository.ts'
import * as sacramentRepository from '#/repositories/sacrament.repository.ts'
import { record as recordActivity } from './activity-log.service.ts'
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
    spouseBirthPlace: normalizeText(input.spouseBirthPlace, 255),
    spouseParishName: normalizeText(input.spouseParishName, 120),
    spouseDioceseName: normalizeText(input.spouseDioceseName, 120),
    spouseBaptismDate: input.spouseBaptismDate || null,
    spouseBaptismPlace: normalizeText(input.spouseBaptismPlace, 255),
    spouseBaptismSponsor: normalizeText(input.spouseBaptismSponsor, 120),
    spouseConfirmationDate: input.spouseConfirmationDate || null,
    spouseConfirmationPlace: normalizeText(input.spouseConfirmationPlace, 255),
    spouseConfirmationSponsor: normalizeText(input.spouseConfirmationSponsor, 120),
    spousePhone: normalizeText(input.spousePhone, 20),
    spouseNote: normalizeText(input.spouseNote, 2000),
    spouseFatherName: normalizeText(input.spouseFatherName, 120),
    spouseMotherName: normalizeText(input.spouseMotherName, 120),
    spouseFatherHolyName: normalizeText(input.spouseFatherHolyName, 75),
    spouseMotherHolyName: normalizeText(input.spouseMotherHolyName, 75),
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
  if (person.personType !== 'parish') {
    throw fieldError('personId', 'Đương sự chính phải là giáo dân trong giáo xứ')
  }
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
      birthPlace: input.spouseBirthPlace,
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
    birthPlace: value.spouseBirthPlace,
    deathDate: null,
    phone: value.spousePhone,
    email: null,
    occupation: null,
    secondaryPhone: null,
    residenceStatus: null,
    pastoralStatus: null,
    pastoralNote: null,
    source: 'transferred',
    note: value.spouseNote,
    personType: 'external',
    parishName: value.spouseParishName,
    dioceseName: value.spouseDioceseName,
    fatherName: value.spouseFatherName,
    motherName: value.spouseMotherName,
    fatherHolyName: value.spouseFatherHolyName,
    motherHolyName: value.spouseMotherHolyName,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  for (const row of [
    {
      type: 'baptism',
      date: value.spouseBaptismDate,
      place: value.spouseBaptismPlace,
      sponsor: value.spouseBaptismSponsor,
    },
    {
      type: 'confirmation',
      date: value.spouseConfirmationDate,
      place: value.spouseConfirmationPlace,
      sponsor: value.spouseConfirmationSponsor,
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

function updateExternalSpouse(personId: string, value: any, timestamp: string) {
  const current = assertFound(
    personRepository.findRawById(personId),
    'Người phối ngẫu không còn tồn tại',
  )
  if (current.personType !== 'external') return current

  personRepository.update(
    personId,
    {
      fullName: value.spouseName,
      fullNameAscii: toAscii(value.spouseName),
      holyName: value.spouseHolyName,
      birthDate: value.spouseBirthDate,
      birthPlace: value.spouseBirthPlace,
      phone: value.spousePhone,
      note: value.spouseNote,
      parishName: value.spouseParishName,
      dioceseName: value.spouseDioceseName,
      fatherName: value.spouseFatherName,
      motherName: value.spouseMotherName,
      fatherHolyName: value.spouseFatherHolyName,
      motherHolyName: value.spouseMotherHolyName,
    },
    timestamp,
  )
  sacramentRepository.softDeleteInitiationByPersonId(personId, timestamp)
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
        personId,
        ...row,
        minister: null,
        sponsor: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
  }
  return personRepository.findRawById(personId)
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
  const timestamp = now()
  return runInTransaction(() => {
    const current = assertFound(marriageRepository.findById(id), NOT_FOUND_MESSAGE)
    assertVersion({ updatedAt: current.updated_at }, expectedUpdatedAt)

    // Update là patch: giữ nguyên các trường và người phối ngẫu hiện tại nếu payload
    // không đề cập tới chúng. Chỉ tạo người ngoài xứ mới khi caller thực sự gửi tên mới.
    const participantsNow = marriageRepository.findParticipantsByMarriageId(id)
    const currentPersonId = participantsNow[0]?.personId
    const currentSpouse = participantsNow[1]
    const currentSpouseId = currentSpouse?.personId ?? null
    const merged = {
      personId: currentPersonId,
      date: current.date,
      minister: current.minister,
      place: current.place,
      status: current.status,
      note: current.note,
      witnessOne: current.witness_one,
      witnessTwo: current.witness_two,
      spouseId: currentSpouseId,
      spouseName: currentSpouse?.fullName,
      spouseHolyName: currentSpouse?.holyName,
      spouseBirthDate: currentSpouse?.birthDate,
      spouseBirthPlace: currentSpouse?.birthPlace,
      spouseParishName: currentSpouse?.parishName,
      spouseDioceseName: currentSpouse?.dioceseName,
      spouseBaptismDate: currentSpouse?.baptismDate,
      spouseBaptismPlace: currentSpouse?.baptismPlace,
      spouseConfirmationDate: currentSpouse?.confirmationDate,
      spouseConfirmationPlace: currentSpouse?.confirmationPlace,
      spouseFatherName: currentSpouse?.fatherName,
      spouseFatherHolyName: currentSpouse?.fatherHolyName,
      spouseMotherName: currentSpouse?.motherName,
      spouseMotherHolyName: currentSpouse?.motherHolyName,
      ...patch,
    }
    if (Object.hasOwn(patch, 'spouseName') && !Object.hasOwn(patch, 'spouseId')) {
      merged.spouseId = null
    }
    const value = normalize(merged)
    if (!value.spouseId) value.spouseId = createExternalSpouse(value, timestamp).id
    else updateExternalSpouse(value.spouseId, value, timestamp)
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
    const timestamp = now()
    marriageRepository.softDeleteById(id, timestamp)
    recordActivity({ entityType: 'marriage', entityId: id, action: 'removed', timestamp })
    return { id }
  })
}
