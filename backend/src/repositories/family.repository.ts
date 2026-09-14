import { likePattern, orderBy, paginate, prepare } from './query-helpers.ts'

/** Repository của `families`. Nơi duy nhất viết SQL cho hộ gia đình. */

const SORT_COLUMNS = Object.freeze({ name: 'f.name_ascii' })

const SELECT_COLUMNS = 'id, zone_id, name, name_ascii, address, note, created_at, updated_at'

const UPDATABLE = Object.freeze({
  zoneId: 'zone_id',
  name: 'name',
  nameAscii: 'name_ascii',
  address: 'address',
  note: 'note',
})

export function toDomain(row) {
  if (!row) return null

  return {
    id: row.id,
    zoneId: row.zone_id,
    name: row.name,
    nameAscii: row.name_ascii,
    address: row.address ?? null,
    note: row.note ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.zone_name === undefined ? {} : { zoneName: row.zone_name }),
    ...(row.member_count === undefined ? {} : { memberCount: row.member_count }),
  }
}

function buildFilter(filter: any = {}) {
  const clauses = ['f.deleted_at IS NULL']
  const params = []

  if (filter.zoneId) {
    clauses.push('f.zone_id = ?')
    params.push(filter.zoneId)
  }

  if (filter.search) {
    clauses.push("f.name_ascii LIKE ? ESCAPE '\\'")
    params.push(likePattern(filter.search))
  }

  return { where: clauses.join(' AND '), params }
}

/** Kèm `zoneName` để màn hình chi tiết không phải gọi thêm một kênh nữa. */
export function findById(id) {
  const row = prepare(
    'SELECT f.id, f.zone_id, f.name, f.name_ascii, f.address, f.note, f.created_at,' +
      ' f.updated_at,' +
      ' z.name AS zone_name' +
      ' FROM families f' +
      ' JOIN zones z ON z.id = f.zone_id' +
      ' WHERE f.id = ? AND f.deleted_at IS NULL',
  ).get(id)

  return toDomain(row)
}

/** Không join — dùng cho kiểm tra tiền điều kiện bên trong transaction. */
export function findRawById(id) {
  return toDomain(
    prepare('SELECT ' + SELECT_COLUMNS + ' FROM families WHERE id = ? AND deleted_at IS NULL').get(
      id,
    ),
  )
}

/**
 * Danh sách kèm `zoneName` và `memberCount` bằng **một** câu truy vấn — không lặp
 * `findById` trong vòng lặp (cạm bẫy N+1).
 */
export function findMany(filter: any = {}) {
  const { where, params } = buildFilter(filter)
  const { limit, offset } = paginate(filter)

  const sql =
    'SELECT f.id, f.zone_id, f.name, f.name_ascii, f.address, f.note, f.created_at,' +
    ' f.updated_at,' +
    ' z.name AS zone_name,' +
    ' COUNT(DISTINCT fm.person_id) AS member_count' +
    ' FROM families f' +
    ' JOIN zones z ON z.id = f.zone_id' +
    ' LEFT JOIN family_members fm' +
    '   ON fm.family_id = f.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
    ' WHERE ' +
    where +
    ' GROUP BY f.id' +
    ' ORDER BY ' +
    orderBy(SORT_COLUMNS, 'name', filter) +
    ' LIMIT ? OFFSET ?'

  return prepare(sql)
    .all(...params, limit, offset)
    .map(toDomain)
}

export function count(filter: any = {}) {
  const { where, params } = buildFilter(filter)

  return prepare('SELECT COUNT(*) AS total FROM families f WHERE ' + where).get(...params).total
}

export function insert(record) {
  prepare(
    'INSERT INTO families (id, zone_id, name, name_ascii, address, note, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    record.id,
    record.zoneId,
    record.name,
    record.nameAscii,
    record.address,
    record.note,
    record.createdAt,
    record.updatedAt,
  )

  return findById(record.id)
}

export function update(id, patch, updatedAt) {
  const assignments = []
  const params = []

  for (const [field, column] of Object.entries(UPDATABLE)) {
    if (!Object.hasOwn(patch, field)) continue
    assignments.push(column + ' = ?')
    params.push(patch[field])
  }

  assignments.push('updated_at = ?')
  params.push(updatedAt, id)

  const changed = prepare(
    'UPDATE families SET ' + assignments.join(', ') + ' WHERE id = ? AND deleted_at IS NULL',
  ).run(...params).changes

  return changed > 0 ? findById(id) : null
}

export function softDelete(id, deletedAt) {
  return (
    prepare(
      'UPDATE families SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    ).run(deletedAt, deletedAt, id).changes > 0
  )
}

export function hardDelete(id) {
  return prepare('DELETE FROM families WHERE id = ?').run(id).changes > 0
}

export function exists(id) {
  return Boolean(
    prepare('SELECT 1 AS ok FROM families WHERE id = ? AND deleted_at IS NULL').get(id),
  )
}

/** Số thành viên **hiện hành** của hộ — dùng để chặn xoá hộ còn người. */
export function countMembers(familyId) {
  return prepare(
    'SELECT COUNT(*) AS total FROM family_members' +
      ' WHERE family_id = ? AND deleted_at IS NULL AND to_date IS NULL',
  ).get(familyId).total
}
