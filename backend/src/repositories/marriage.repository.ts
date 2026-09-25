import { likePattern, paginate, prepare } from './query-helpers.ts'

function toDomain(row: any) {
  if (!row) return null
  return {
    id: row.id,
    date: row.date,
    minister: row.minister ?? null,
    place: row.place ?? null,
    status: row.status ?? 'married',
    note: row.note ?? null,
    witnessOne: row.witness_one ?? null,
    witnessTwo: row.witness_two ?? null,
    spouseId: row.spouse_id ?? null,
    spouseFullName: row.spouse_full_name ?? null,
    spouseIsExternal: row.spouse_person_type === 'external',
    spouseHolyName: row.spouse_holy_name ?? null,
    spouseBirthDate: row.spouse_birth_date ?? null,
    spouseParishName: row.spouse_parish_name ?? null,
    spouseDioceseName: row.spouse_diocese_name ?? null,
    spouseBaptismDate: row.spouse_baptism_date ?? null,
    spouseBaptismPlace: row.spouse_baptism_place ?? null,
    spouseConfirmationDate: row.spouse_confirmation_date ?? null,
    spouseConfirmationPlace: row.spouse_confirmation_place ?? null,
    spouseFatherName: row.spouse_father_name ?? null,
    spouseMotherName: row.spouse_mother_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SPOUSE_COLUMNS =
  'm.id, m.date, m.minister, m.place, m.status, m.note, m.witness_one, m.witness_two,' +
  ' m.created_at, m.updated_at, spouse.person_id AS spouse_id,' +
  ' spouse_person.person_type AS spouse_person_type, spouse_person.full_name AS spouse_full_name,' +
  ' spouse_person.holy_name AS spouse_holy_name, spouse_person.birth_date AS spouse_birth_date,' +
  ' spouse_person.parish_name AS spouse_parish_name, spouse_person.diocese_name AS spouse_diocese_name,' +
  " (SELECT date FROM sacraments s WHERE s.person_id = spouse.person_id AND s.type = 'baptism' AND s.deleted_at IS NULL) AS spouse_baptism_date," +
  " (SELECT place FROM sacraments s WHERE s.person_id = spouse.person_id AND s.type = 'baptism' AND s.deleted_at IS NULL) AS spouse_baptism_place," +
  " (SELECT date FROM sacraments s WHERE s.person_id = spouse.person_id AND s.type = 'confirmation' AND s.deleted_at IS NULL) AS spouse_confirmation_date," +
  " (SELECT place FROM sacraments s WHERE s.person_id = spouse.person_id AND s.type = 'confirmation' AND s.deleted_at IS NULL) AS spouse_confirmation_place," +
  ' spouse_person.father_name AS spouse_father_name, spouse_person.mother_name AS spouse_mother_name'

const JOINS = ' LEFT JOIN persons spouse_person ON spouse_person.id = spouse.person_id'

export function findByPersonId(personId: string) {
  return toDomain(
    prepare(
      'SELECT ' +
        SPOUSE_COLUMNS +
        ' FROM marriage_participants participant JOIN marriages m ON m.id = participant.marriage_id AND m.deleted_at IS NULL LEFT JOIN marriage_participants spouse ON spouse.marriage_id = m.id AND spouse.id <> participant.id AND spouse.deleted_at IS NULL' +
        JOINS +
        ' WHERE participant.person_id = ? AND participant.deleted_at IS NULL ORDER BY m.date DESC, m.created_at DESC LIMIT 1',
    ).get(personId),
  )
}

export function findManyByPersonId(personId: string) {
  return prepare(
    'SELECT ' +
      SPOUSE_COLUMNS +
      ' FROM marriage_participants participant JOIN marriages m ON m.id = participant.marriage_id AND m.deleted_at IS NULL LEFT JOIN marriage_participants spouse ON spouse.marriage_id = m.id AND spouse.id <> participant.id AND spouse.deleted_at IS NULL' +
      JOINS +
      ' WHERE participant.person_id = ? AND participant.deleted_at IS NULL ORDER BY m.date DESC, m.created_at DESC',
  )
    .all(personId)
    .map(toDomain)
}

export function findById(id: string) {
  return prepare(
    'SELECT id, date, minister, place, status, note, witness_one, witness_two, created_at, updated_at FROM marriages WHERE id = ? AND deleted_at IS NULL',
  ).get(id)
}

export function findParticipantsByMarriageId(marriageId: string) {
  return prepare(
    "SELECT mp.person_id AS personId, p.full_name AS fullName, p.full_name_ascii AS fullNameAscii, p.person_type AS personType, p.holy_name AS holyName, p.birth_date AS birthDate, p.parish_name AS parishName, p.diocese_name AS dioceseName, p.father_name AS fatherName, p.mother_name AS motherName, (SELECT date FROM sacraments s WHERE s.person_id = mp.person_id AND s.type = 'baptism' AND s.deleted_at IS NULL) AS baptismDate, (SELECT place FROM sacraments s WHERE s.person_id = mp.person_id AND s.type = 'baptism' AND s.deleted_at IS NULL) AS baptismPlace, (SELECT date FROM sacraments s WHERE s.person_id = mp.person_id AND s.type = 'confirmation' AND s.deleted_at IS NULL) AS confirmationDate, (SELECT place FROM sacraments s WHERE s.person_id = mp.person_id AND s.type = 'confirmation' AND s.deleted_at IS NULL) AS confirmationPlace FROM marriage_participants mp JOIN persons p ON p.id = mp.person_id WHERE mp.marriage_id = ? AND mp.deleted_at IS NULL ORDER BY mp.created_at",
  ).all(marriageId)
}

export function findMany(filter: any = {}) {
  const { limit, offset } = paginate(filter)
  const clauses = ['m.deleted_at IS NULL']
  const params: any[] = []
  if (filter.search) {
    clauses.push(
      "EXISTS (SELECT 1 FROM marriage_participants sm JOIN persons sp ON sp.id = sm.person_id WHERE sm.marriage_id = m.id AND sm.deleted_at IS NULL AND sp.full_name_ascii LIKE ? ESCAPE '\\')",
    )
    params.push(likePattern(filter.search))
  }
  const rows = prepare(
    "SELECT m.id, m.date, m.minister, m.place, m.status, m.note, m.witness_one, m.witness_two, m.updated_at AS updatedAt, group_concat(p.full_name, ' và ') AS participants, group_concat(p.id, '|') AS participantIds, group_concat(p.full_name, '|') AS participantNames, group_concat(COALESCE(p.holy_name, ''), '|') AS participantHolyNames FROM marriages m JOIN marriage_participants mp ON mp.marriage_id = m.id AND mp.deleted_at IS NULL JOIN persons p ON p.id = mp.person_id" +
      ` WHERE ${clauses.join(' AND ')} GROUP BY m.id ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
  ).all(...params, limit, offset)
  return rows.map((row: any) => {
    const ids = String(row.participantIds).split('|')
    const names = String(row.participantNames).split('|')
    const holyNames = String(row.participantHolyNames).split('|')
    return {
      ...row,
      personId: ids[0] ?? null,
      spouseId: ids[1] ?? null,
      personName: names[0],
      spouseName: names[1],
      participantHolyNames: holyNames.map((v) => v || null),
      status: row.status ?? 'married',
      note: row.note ?? null,
      witnessOne: row.witness_one ?? null,
      witnessTwo: row.witness_two ?? null,
    }
  })
}

export function count(filter: any = {}) {
  if (filter.search)
    return prepare(
      "SELECT COUNT(*) AS total FROM marriages m WHERE m.deleted_at IS NULL AND EXISTS (SELECT 1 FROM marriage_participants sm JOIN persons sp ON sp.id = sm.person_id WHERE sm.marriage_id = m.id AND sm.deleted_at IS NULL AND sp.full_name_ascii LIKE ? ESCAPE '\\')",
    ).get(likePattern(filter.search)).total
  return prepare('SELECT COUNT(*) AS total FROM marriages m WHERE m.deleted_at IS NULL').get().total
}

export function insert(record: any) {
  prepare(
    'INSERT INTO marriages (id, date, minister, place, status, note, witness_one, witness_two, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    record.id,
    record.date,
    record.minister,
    record.place,
    record.status,
    record.note,
    record.witnessOne,
    record.witnessTwo,
    record.createdAt,
    record.updatedAt,
  )
}

export function insertParticipants(records: any[]) {
  const statement = prepare(
    'INSERT INTO marriage_participants (id, marriage_id, person_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  )
  for (const record of records)
    statement.run(record.id, record.marriageId, record.personId, record.createdAt, record.updatedAt)
}

export function update(id: string, record: any, updatedAt: string) {
  prepare(
    'UPDATE marriages SET date = ?, minister = ?, place = ?, status = ?, note = ?, witness_one = ?, witness_two = ?, updated_at = ? WHERE id = ?',
  ).run(
    record.date,
    record.minister,
    record.place,
    record.status,
    record.note,
    record.witnessOne,
    record.witnessTwo,
    updatedAt,
    id,
  )
}
export function replaceParticipants(id: string, records: any[], updatedAt: string) {
  prepare(
    'UPDATE marriage_participants SET deleted_at = ?, updated_at = ? WHERE marriage_id = ? AND deleted_at IS NULL',
  ).run(updatedAt, updatedAt, id)
  insertParticipants(records)
}
export function softDeleteById(id: string, timestamp: string) {
  prepare(
    'UPDATE marriages SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
  ).run(timestamp, timestamp, id)
  prepare(
    'UPDATE marriage_participants SET deleted_at = ?, updated_at = ? WHERE marriage_id = ? AND deleted_at IS NULL',
  ).run(timestamp, timestamp, id)
}
export function softDeleteByPersonIds(ids: string[], timestamp: string) {
  const json = JSON.stringify(ids)
  prepare(
    'UPDATE marriage_participants SET deleted_at = ?, updated_at = ? WHERE marriage_id IN (SELECT marriage_id FROM marriage_participants WHERE person_id IN (SELECT value FROM json_each(?)) AND deleted_at IS NULL) AND deleted_at IS NULL',
  ).run(timestamp, timestamp, json)
  prepare(
    'UPDATE marriages SET deleted_at = ?, updated_at = ? WHERE id IN (SELECT marriage_id FROM marriage_participants WHERE person_id IN (SELECT value FROM json_each(?))) AND deleted_at IS NULL',
  ).run(timestamp, timestamp, json)
}
export function restoreByPersonId(personId: string, deletedAt: string, updatedAt: string) {
  const row = prepare(
    'SELECT marriage_id FROM marriage_participants WHERE person_id = ? AND deleted_at = ? LIMIT 1',
  ).get(personId, deletedAt)
  if (!row) return
  prepare(
    'UPDATE marriages SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at = ?',
  ).run(updatedAt, row.marriage_id, deletedAt)
  prepare(
    'UPDATE marriage_participants SET deleted_at = NULL, updated_at = ? WHERE marriage_id = ? AND deleted_at = ?',
  ).run(updatedAt, row.marriage_id, deletedAt)
}
export function hardDeleteByPersonId(personId: string) {
  const row = prepare(
    'SELECT marriage_id FROM marriage_participants WHERE person_id = ? LIMIT 1',
  ).get(personId)
  if (!row) return
  prepare('DELETE FROM marriage_participants WHERE marriage_id = ?').run(row.marriage_id)
  prepare('DELETE FROM marriages WHERE id = ? AND deleted_at IS NOT NULL').run(row.marriage_id)
}
