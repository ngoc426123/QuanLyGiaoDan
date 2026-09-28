import { likePattern, orderBy, paginate, prepare } from './query-helpers.ts'

const SELECT_COLUMNS = 'id, category, value, value_ascii, sort_order, created_at, updated_at'
const SORT_COLUMNS = Object.freeze({
  value: 'value_ascii',
  sortOrder: 'sort_order',
  createdAt: 'created_at',
})
const UPDATABLE = Object.freeze({
  value: 'value',
  valueAscii: 'value_ascii',
  sortOrder: 'sort_order',
})

export function toDomain(row) {
  if (!row) return null
  return {
    id: row.id,
    category: row.category,
    value: row.value,
    valueAscii: row.value_ascii,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function findMany(filter: any = {}) {
  const clauses = ['deleted_at IS NULL', 'category = ?']
  const params: any[] = [filter.category]
  if (filter.search) {
    clauses.push("value_ascii LIKE ? ESCAPE '\\'")
    params.push(likePattern(filter.search))
  }
  const { limit, offset } = paginate(filter)
  const sql =
    'SELECT ' +
    SELECT_COLUMNS +
    ' FROM suggestion_items WHERE ' +
    clauses.join(' AND ') +
    ' ORDER BY ' +
    orderBy(SORT_COLUMNS, 'sortOrder', filter, 'ASC') +
    ', value_ascii ASC LIMIT ? OFFSET ?'
  return prepare(sql)
    .all(...params, limit, offset)
    .map(toDomain)
}

export function count(filter: any = {}) {
  const clauses = ['deleted_at IS NULL', 'category = ?']
  const params: any[] = [filter.category]
  if (filter.search) {
    clauses.push("value_ascii LIKE ? ESCAPE '\\'")
    params.push(likePattern(filter.search))
  }
  return prepare(
    'SELECT COUNT(*) AS total FROM suggestion_items WHERE ' + clauses.join(' AND '),
  ).get(...params).total
}

export function findById(id) {
  return toDomain(
    prepare(
      'SELECT ' + SELECT_COLUMNS + ' FROM suggestion_items WHERE id = ? AND deleted_at IS NULL',
    ).get(id),
  )
}

export function findByValue(category, valueAscii, exceptId?) {
  const suffix = exceptId ? ' AND id <> ?' : ''
  const params = exceptId ? [category, valueAscii, exceptId] : [category, valueAscii]
  return toDomain(
    prepare(
      'SELECT ' +
        SELECT_COLUMNS +
        ' FROM suggestion_items WHERE category = ? AND value_ascii = ? AND deleted_at IS NULL' +
        suffix,
    ).get(...params),
  )
}

export function insert(record) {
  prepare(
    'INSERT INTO suggestion_items (id, category, value, value_ascii, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    record.id,
    record.category,
    record.value,
    record.valueAscii,
    record.sortOrder,
    record.createdAt,
    record.updatedAt,
  )
  return findById(record.id)
}

export function update(id, patch, updatedAt) {
  const assignments: string[] = []
  const params: any[] = []
  for (const [field, column] of Object.entries(UPDATABLE)) {
    if (!Object.hasOwn(patch, field)) continue
    assignments.push(column + ' = ?')
    params.push(patch[field])
  }
  assignments.push('updated_at = ?')
  params.push(updatedAt, id)
  const changed = prepare(
    'UPDATE suggestion_items SET ' +
      assignments.join(', ') +
      ' WHERE id = ? AND deleted_at IS NULL',
  ).run(...params).changes
  return changed > 0 ? findById(id) : null
}

export function softDelete(id, deletedAt) {
  return (
    prepare(
      'UPDATE suggestion_items SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    ).run(deletedAt, deletedAt, id).changes > 0
  )
}
