import { prepare } from './query-helpers.ts'

export function insert(record: any) {
  prepare(
    'INSERT INTO activity_logs (id, entity_type, entity_id, action, changes, created_at) VALUES (@id, @entityType, @entityId, @action, @changes, @createdAt)',
  ).run(record)
}

export function findByEntity(entityType: string, entityId: string) {
  return prepare(
    'SELECT id, entity_type, entity_id, action, changes, created_at FROM activity_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC, rowid DESC',
  ).all(entityType, entityId)
}

export function removeBefore(timestamp: string) {
  return prepare('DELETE FROM activity_logs WHERE created_at < ?').run(timestamp).changes
}
