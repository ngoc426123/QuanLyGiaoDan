import { prepare } from './query-helpers.ts'

function toDomain(row: any) {
  if (!row) return null
  return {
    id: row.id,
    role: row.role,
    personId: row.parent_person_id,
    fullName: row.parent_full_name ?? null,
    holyName: row.parent_holy_name ?? null,
    personType: row.parent_person_type ?? 'parish',
  }
}

export function findByChildId(childId: string) {
  return prepare(
    'SELECT pp.id, pp.role, pp.parent_person_id, p.full_name AS parent_full_name,' +
      ' p.holy_name AS parent_holy_name, p.person_type AS parent_person_type FROM person_parents pp' +
      ' JOIN persons p ON p.id = pp.parent_person_id' +
      ' WHERE pp.child_person_id = ? AND pp.deleted_at IS NULL ORDER BY pp.role',
  )
    .all(childId)
    .map(toDomain)
}

export function replaceForChild(childId: string, records: any[], timestamp: string) {
  prepare(
    'UPDATE person_parents SET deleted_at = ?, updated_at = ? WHERE child_person_id = ? AND deleted_at IS NULL',
  ).run(timestamp, timestamp, childId)
  const insert = prepare(
    'INSERT INTO person_parents (id, child_person_id, role, parent_person_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
  for (const record of records)
    insert.run(record.id, childId, record.role, record.parentPersonId, timestamp, timestamp)
}

export function restoreByChildId(childId: string, deletedAt: string, timestamp: string) {
  return prepare(
    'UPDATE person_parents SET deleted_at = NULL, updated_at = ? WHERE child_person_id = ? AND deleted_at = ?',
  ).run(timestamp, childId, deletedAt).changes
}

export function softDeleteByChildId(childId: string, timestamp: string) {
  return prepare(
    'UPDATE person_parents SET deleted_at = ?, updated_at = ? WHERE child_person_id = ? AND deleted_at IS NULL',
  ).run(timestamp, timestamp, childId).changes
}

export function hardDeleteByPersonId(personId: string) {
  return prepare(
    'DELETE FROM person_parents WHERE child_person_id = ? OR parent_person_id = ?',
  ).run(personId, personId).changes
}
