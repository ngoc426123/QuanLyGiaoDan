import { prepare } from './query-helpers.ts'

const RESTORE_SQL = Object.freeze({
  zone: 'UPDATE zones SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL',
  family:
    'UPDATE families SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL',
  person:
    'UPDATE persons SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL',
})
const HARD_REMOVE_SQL = Object.freeze({
  zone: 'DELETE FROM zones WHERE id = ? AND deleted_at IS NOT NULL',
  family: 'DELETE FROM families WHERE id = ? AND deleted_at IS NOT NULL',
  person: 'DELETE FROM persons WHERE id = ? AND deleted_at IS NOT NULL',
})

export function findMany() {
  return prepare(
    "SELECT id, 'zone' AS type, name AS title, deleted_at FROM zones WHERE deleted_at IS NOT NULL" +
      " UNION ALL SELECT id, 'family', name, deleted_at FROM families WHERE deleted_at IS NOT NULL" +
      " UNION ALL SELECT id, 'person', full_name, deleted_at FROM persons WHERE deleted_at IS NOT NULL" +
      ' ORDER BY deleted_at DESC LIMIT 200',
  ).all()
}

export function restore(type: string, id: string, updatedAt: string) {
  return prepare(RESTORE_SQL[type]).run(updatedAt, id).changes > 0
}

export function findDeletedFamily(id: string) {
  return prepare('SELECT zone_id FROM families WHERE id = ? AND deleted_at IS NOT NULL').get(id)
}

export function isLiveZone(id: string) {
  return Boolean(prepare('SELECT 1 FROM zones WHERE id = ? AND deleted_at IS NULL').get(id))
}

export function hardRemove(type: string, id: string) {
  return prepare(HARD_REMOVE_SQL[type]).run(id).changes > 0
}

export function empty() {
  prepare('DELETE FROM family_members WHERE deleted_at IS NOT NULL').run()
  prepare('DELETE FROM persons WHERE deleted_at IS NOT NULL').run()
  prepare('DELETE FROM families WHERE deleted_at IS NOT NULL').run()
  return prepare('DELETE FROM zones WHERE deleted_at IS NOT NULL').run().changes
}
