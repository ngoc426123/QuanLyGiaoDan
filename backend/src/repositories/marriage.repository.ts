import { likePattern, paginate, prepare } from './query-helpers.ts'

function toDomain(row) {
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
    spouseId: row.spouse_id,
    spouseFullName: row.spouse_full_name,
    spouseIsExternal: Boolean(row.spouse_is_external),
    spouseHolyName: row.spouse_holy_name ?? null,
    spouseBirthDate: row.spouse_birth_date ?? null,
    spouseParishName: row.spouse_parish_name ?? null,
    spouseDioceseName: row.spouse_diocese_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function findByPersonId(personId: string) {
  return toDomain(
    prepare(
      'SELECT m.id, m.date, m.minister, m.place, m.status, m.note, m.witness_one, m.witness_two,' +
        ' m.created_at, m.updated_at,' +
        ' spouse.person_id AS spouse_id, spouse.full_name AS spouse_full_name,' +
        ' spouse.is_external AS spouse_is_external, spouse.holy_name AS spouse_holy_name,' +
        ' spouse.birth_date AS spouse_birth_date, spouse.parish_name AS spouse_parish_name,' +
        ' spouse.diocese_name AS spouse_diocese_name' +
        ' FROM marriage_participants participant' +
        ' JOIN marriages m ON m.id = participant.marriage_id AND m.deleted_at IS NULL' +
        ' LEFT JOIN marriage_participants spouse ON spouse.marriage_id = m.id' +
        '   AND spouse.id <> participant.id AND spouse.deleted_at IS NULL' +
        ' WHERE participant.person_id = ? AND participant.deleted_at IS NULL' +
        ' ORDER BY m.date DESC, m.created_at DESC LIMIT 1',
    ).get(personId),
  )
}

export function findManyByPersonId(personId: string) {
  return prepare(
    'SELECT m.id, m.date, m.minister, m.place, m.status, m.note, m.witness_one, m.witness_two,' +
      ' m.created_at, m.updated_at,' +
      ' spouse.person_id AS spouse_id, spouse.full_name AS spouse_full_name,' +
      ' spouse.is_external AS spouse_is_external, spouse.holy_name AS spouse_holy_name,' +
      ' spouse.birth_date AS spouse_birth_date, spouse.parish_name AS spouse_parish_name,' +
      ' spouse.diocese_name AS spouse_diocese_name' +
      ' FROM marriage_participants participant' +
      ' JOIN marriages m ON m.id = participant.marriage_id AND m.deleted_at IS NULL' +
      ' LEFT JOIN marriage_participants spouse ON spouse.marriage_id = m.id' +
      '   AND spouse.id <> participant.id AND spouse.deleted_at IS NULL' +
      ' WHERE participant.person_id = ? AND participant.deleted_at IS NULL' +
      ' ORDER BY m.date DESC, m.created_at DESC',
  )
    .all(personId)
    .map(toDomain)
}

export function findById(id: string) {
  return prepare(
    'SELECT id, date, minister, place, status, note, witness_one, witness_two, created_at, updated_at FROM marriages' +
      ' WHERE id = ? AND deleted_at IS NULL',
  ).get(id)
}

export function findParticipantsByMarriageId(marriageId: string) {
  return prepare(
    'SELECT person_id AS personId, full_name AS fullName, full_name_ascii AS fullNameAscii,' +
      ' is_external AS isExternal, holy_name AS holyName, birth_date AS birthDate,' +
      ' parish_name AS parishName, diocese_name AS dioceseName FROM marriage_participants' +
      ' WHERE marriage_id = ? AND deleted_at IS NULL ORDER BY created_at',
  ).all(marriageId)
}

export function findMany(filter: any = {}) {
  const { limit, offset } = paginate(filter)
  const clauses = ['m.deleted_at IS NULL']
  const params: any[] = []
  if (filter.search) {
    clauses.push(
      'EXISTS (SELECT 1 FROM marriage_participants search_mp' +
        ' LEFT JOIN persons search_person ON search_person.id = search_mp.person_id' +
        ' WHERE search_mp.marriage_id = m.id AND search_mp.deleted_at IS NULL' +
        " AND ((search_person.deleted_at IS NULL AND search_person.full_name_ascii LIKE ? ESCAPE '\\')" +
        " OR (search_mp.person_id IS NULL AND search_mp.full_name_ascii LIKE ? ESCAPE '\\')))",
    )
    params.push(likePattern(filter.search), likePattern(filter.search))
  }
  const rows = prepare(
    'SELECT m.id, m.date, m.minister, m.place, m.status, m.note, m.witness_one, m.witness_two,' +
      ' m.updated_at AS updatedAt,' +
      " group_concat(mp.full_name, ' và ') AS participants," +
      " group_concat(COALESCE(mp.person_id, ''), '|') AS participantIds," +
      " group_concat(mp.full_name, '|') AS participantNames," +
      ' MAX(CASE WHEN mp.person_id IS NULL THEN mp.holy_name END) AS spouseHolyName,' +
      ' MAX(CASE WHEN mp.person_id IS NULL THEN mp.birth_date END) AS spouseBirthDate,' +
      ' MAX(CASE WHEN mp.person_id IS NULL THEN mp.parish_name END) AS spouseParishName,' +
      ' MAX(CASE WHEN mp.person_id IS NULL THEN mp.diocese_name END) AS spouseDioceseName' +
      ' FROM marriages m JOIN marriage_participants mp' +
      ' ON mp.marriage_id = m.id AND mp.deleted_at IS NULL' +
      ` WHERE ${clauses.join(' AND ')} GROUP BY m.id ORDER BY m.date DESC LIMIT ? OFFSET ?`,
  ).all(...params, limit, offset)
  return rows.map((row) => {
    const [personId, spouseId] = row.participantIds.split('|')
    const [personName, spouseName] = row.participantNames.split('|')
    return {
      ...row,
      personId: personId || null,
      spouseId: spouseId || null,
      personName,
      spouseName,
      spouseHolyName: row.spouseHolyName ?? null,
      spouseBirthDate: row.spouseBirthDate ?? null,
      spouseParishName: row.spouseParishName ?? null,
      spouseDioceseName: row.spouseDioceseName ?? null,
      status: row.status ?? 'married',
      note: row.note ?? null,
      witnessOne: row.witness_one ?? null,
      witnessTwo: row.witness_two ?? null,
    }
  })
}

export function count(filter: any = {}) {
  const clauses = ['m.deleted_at IS NULL']
  const params: any[] = []
  if (filter.search) {
    clauses.push(
      'EXISTS (SELECT 1 FROM marriage_participants search_mp' +
        ' LEFT JOIN persons search_person ON search_person.id = search_mp.person_id' +
        ' WHERE search_mp.marriage_id = m.id AND search_mp.deleted_at IS NULL' +
        " AND ((search_person.deleted_at IS NULL AND search_person.full_name_ascii LIKE ? ESCAPE '\\')" +
        " OR (search_mp.person_id IS NULL AND search_mp.full_name_ascii LIKE ? ESCAPE '\\')))",
    )
    params.push(likePattern(filter.search), likePattern(filter.search))
  }
  return prepare(`SELECT COUNT(*) AS total FROM marriages m WHERE ${clauses.join(' AND ')}`).get(
    ...params,
  ).total
}

export function insert(record) {
  prepare(
    'INSERT INTO marriages (id, date, minister, place, status, note, witness_one, witness_two,' +
      ' created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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

export function insertParticipants(records) {
  const statement = prepare(
    'INSERT INTO marriage_participants' +
      ' (id, marriage_id, person_id, full_name, full_name_ascii, is_external, holy_name,' +
      ' birth_date, parish_name, diocese_name, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
  for (const record of records) {
    statement.run(
      record.id,
      record.marriageId,
      record.personId,
      record.fullName,
      record.fullNameAscii,
      record.isExternal ? 1 : 0,
      record.holyName ?? null,
      record.birthDate ?? null,
      record.parishName ?? null,
      record.dioceseName ?? null,
      record.createdAt,
      record.updatedAt,
    )
  }
}

export function update(id, record, updatedAt) {
  prepare(
    'UPDATE marriages SET date = ?, minister = ?, place = ?, status = ?, note = ?, witness_one = ?,' +
      ' witness_two = ?, updated_at = ? WHERE id = ?',
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

export function replaceParticipants(marriageId, records, updatedAt) {
  prepare(
    'UPDATE marriage_participants SET deleted_at = ?, updated_at = ?' +
      ' WHERE marriage_id = ? AND deleted_at IS NULL',
  ).run(updatedAt, updatedAt, marriageId)
  insertParticipants(records)
}

export function softDeleteById(id, deletedAt) {
  prepare(
    'UPDATE marriages SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
  ).run(deletedAt, deletedAt, id)
  prepare(
    'UPDATE marriage_participants SET deleted_at = ?, updated_at = ?' +
      ' WHERE marriage_id = ? AND deleted_at IS NULL',
  ).run(deletedAt, deletedAt, id)
}

export function softDeleteByPersonIds(personIds, deletedAt) {
  const ids = JSON.stringify(personIds)
  prepare(
    'UPDATE marriage_participants SET deleted_at = ?, updated_at = ? WHERE marriage_id IN (' +
      ' SELECT marriage_id FROM marriage_participants' +
      ' WHERE person_id IN (SELECT value FROM json_each(?)) AND deleted_at IS NULL' +
      ') AND deleted_at IS NULL',
  ).run(deletedAt, deletedAt, ids)
  prepare(
    'UPDATE marriages SET deleted_at = ?, updated_at = ? WHERE id IN (' +
      ' SELECT marriage_id FROM marriage_participants' +
      ' WHERE person_id IN (SELECT value FROM json_each(?))' +
      ') AND deleted_at IS NULL',
  ).run(deletedAt, deletedAt, ids)
}

export function restoreByPersonId(personId, deletedAt, updatedAt) {
  const marriage = prepare(
    'SELECT marriage_id FROM marriage_participants WHERE person_id = ? AND deleted_at = ? LIMIT 1',
  ).get(personId, deletedAt)
  if (!marriage) return

  prepare(
    'UPDATE marriages SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at = ?',
  ).run(updatedAt, marriage.marriage_id, deletedAt)
  prepare(
    'UPDATE marriage_participants SET deleted_at = NULL, updated_at = ?' +
      ' WHERE marriage_id = ? AND deleted_at = ?',
  ).run(updatedAt, marriage.marriage_id, deletedAt)
}

export function hardDeleteByPersonId(personId) {
  const marriage = prepare(
    'SELECT marriage_id FROM marriage_participants WHERE person_id = ? LIMIT 1',
  ).get(personId)
  if (!marriage) return
  prepare('DELETE FROM marriage_participants WHERE marriage_id = ?').run(marriage.marriage_id)
  prepare('DELETE FROM marriages WHERE id = ? AND deleted_at IS NOT NULL').run(marriage.marriage_id)
}
