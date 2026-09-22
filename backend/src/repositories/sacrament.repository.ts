import { prepare } from './query-helpers.ts'

export function toDomain(row) {
  if (!row) return null

  return {
    id: row.id,
    personId: row.person_id,
    type: row.type,
    date: row.date,
    minister: row.minister ?? null,
    place: row.place ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function findByPersonId(personId: string) {
  return prepare(
    'SELECT id, person_id, type, date, minister, place, created_at, updated_at' +
      ' FROM sacraments WHERE person_id = ? AND deleted_at IS NULL' +
      " ORDER BY CASE type WHEN 'baptism' THEN 1 WHEN 'first_communion' THEN 2" +
      " WHEN 'confirmation' THEN 3 WHEN 'marriage' THEN 4 END",
  )
    .all(personId)
    .map(toDomain)
}

export function softDeleteByPersonId(personId: string, deletedAt: string) {
  prepare(
    'UPDATE sacraments SET deleted_at = ?, updated_at = ?' +
      ' WHERE person_id = ? AND deleted_at IS NULL',
  ).run(deletedAt, deletedAt, personId)
}

/** Bản ghi Hôn phối cũ được giữ làm lịch sử trong lúc chuyển sang `marriages`. */
export function softDeleteInitiationByPersonId(personId: string, deletedAt: string) {
  prepare(
    'UPDATE sacraments SET deleted_at = ?, updated_at = ?' +
      " WHERE person_id = ? AND type IN ('baptism', 'first_communion', 'confirmation')" +
      ' AND deleted_at IS NULL',
  ).run(deletedAt, deletedAt, personId)
}

export function softDeleteByPersonIds(personIds: string[], deletedAt: string) {
  prepare(
    'UPDATE sacraments SET deleted_at = ?, updated_at = ?' +
      ' WHERE person_id IN (SELECT value FROM json_each(?)) AND deleted_at IS NULL',
  ).run(deletedAt, deletedAt, JSON.stringify(personIds))
}

export function restoreByPersonId(personId: string, updatedAt: string) {
  prepare(
    'UPDATE sacraments SET deleted_at = NULL, updated_at = ?' +
      ' WHERE person_id = ? AND deleted_at IS NOT NULL',
  ).run(updatedAt, personId)
}

export function hardDeleteByPersonId(personId: string) {
  prepare('DELETE FROM sacraments WHERE person_id = ? AND deleted_at IS NOT NULL').run(personId)
}

export function insert(record) {
  prepare(
    'INSERT INTO sacraments (id, person_id, type, date, minister, place, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    record.id,
    record.personId,
    record.type,
    record.date,
    record.minister,
    record.place,
    record.createdAt,
    record.updatedAt,
  )
}
