import { paginate, prepare } from './query-helpers.ts'

export function insert(record) {
  prepare(
    'INSERT INTO certificate_issuances (id, person_id, certificate_type, source_id, register_book, register_page, register_entry, person_full_name, snapshot_json, issued_at, created_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    record.id,
    record.personId,
    record.type,
    record.sourceId,
    record.registerBook,
    record.registerPage,
    record.registerEntry,
    record.personFullName,
    record.snapshotJson ?? null,
    record.issuedAt,
    record.createdAt,
  )
}

export function findMany(filter: any = {}) {
  const { limit, offset } = paginate(filter)
  return prepare(
    'SELECT id, person_id AS personId, certificate_type AS type, register_book AS registerBook,' +
      ' register_page AS registerPage, register_entry AS registerEntry, person_full_name AS personFullName, snapshot_json AS snapshotJson,' +
      ' issued_at AS issuedAt, created_at AS createdAt FROM certificate_issuances' +
      ' ORDER BY created_at DESC LIMIT ? OFFSET ?',
  ).all(limit, offset)
}

export function count() {
  return prepare('SELECT COUNT(*) AS total FROM certificate_issuances').get().total
}
