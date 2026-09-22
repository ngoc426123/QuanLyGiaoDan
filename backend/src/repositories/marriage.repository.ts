import { paginate, prepare } from './query-helpers.ts'

function toDomain(row) {
  if (!row) return null

  return {
    id: row.id,
    date: row.date,
    minister: row.minister ?? null,
    place: row.place ?? null,
    spouseId: row.spouse_id,
    spouseFullName: row.spouse_full_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function findByPersonId(personId: string) {
  return toDomain(
    prepare(
      'SELECT m.id, m.date, m.minister, m.place, m.created_at, m.updated_at,' +
        ' spouse.person_id AS spouse_id, spouse.full_name AS spouse_full_name' +
        ' FROM marriage_participants participant' +
        ' JOIN marriages m ON m.id = participant.marriage_id AND m.deleted_at IS NULL' +
        ' JOIN marriage_participants spouse ON spouse.marriage_id = m.id' +
        '   AND spouse.person_id <> participant.person_id AND spouse.deleted_at IS NULL' +
        ' WHERE participant.person_id = ? AND participant.deleted_at IS NULL',
    ).get(personId),
  )
}

export function findById(id: string) {
  return prepare(
    'SELECT id, date, minister, place, created_at, updated_at FROM marriages' +
      ' WHERE id = ? AND deleted_at IS NULL',
  ).get(id)
}

export function findParticipantsByMarriageId(marriageId: string) {
  return prepare(
    'SELECT person_id AS personId, full_name AS fullName FROM marriage_participants' +
      ' WHERE marriage_id = ? AND deleted_at IS NULL ORDER BY created_at',
  ).all(marriageId)
}

export function findMany(filter: any = {}) {
  const { limit, offset } = paginate(filter)
  const rows = prepare(
    'SELECT m.id, m.date, m.minister, m.place, m.updated_at AS updatedAt,' +
      " group_concat(mp.full_name, ' và ') AS participants," +
      " group_concat(mp.person_id, '|') AS participantIds" +
      ' FROM marriages m JOIN marriage_participants mp' +
      ' ON mp.marriage_id = m.id AND mp.deleted_at IS NULL' +
      ' WHERE m.deleted_at IS NULL GROUP BY m.id ORDER BY m.date DESC LIMIT ? OFFSET ?',
  ).all(limit, offset)
  return rows.map((row) => {
    const [personId, spouseId] = row.participantIds.split('|')
    return { ...row, personId, spouseId }
  })
}

export function count() {
  return prepare('SELECT COUNT(*) AS total FROM marriages WHERE deleted_at IS NULL').get().total
}

export function insert(record) {
  prepare(
    'INSERT INTO marriages (id, date, minister, place, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?)',
  ).run(record.id, record.date, record.minister, record.place, record.createdAt, record.updatedAt)
}

export function insertParticipants(records) {
  const statement = prepare(
    'INSERT INTO marriage_participants' +
      ' (id, marriage_id, person_id, full_name, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?)',
  )
  for (const record of records) {
    statement.run(
      record.id,
      record.marriageId,
      record.personId,
      record.fullName,
      record.createdAt,
      record.updatedAt,
    )
  }
}

export function update(id, record, updatedAt) {
  prepare(
    'UPDATE marriages SET date = ?, minister = ?, place = ?, updated_at = ? WHERE id = ?',
  ).run(record.date, record.minister, record.place, updatedAt, id)
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
