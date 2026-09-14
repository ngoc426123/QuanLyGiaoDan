import { likePattern, orderBy, paginate, prepare } from './query-helpers.js'

/**
 * Repository của `zones` — nơi DUY NHẤT viết SQL cho giáo họ. Không có nghiệp vụ ở đây.
 *
 * Luật áp cho mọi câu trong file (`coding-standards-backend.md` §3): tham số hoá `?`,
 * cấm `SELECT *`, mọi truy vấn đọc có `deleted_at IS NULL`, mọi truy vấn danh sách có `LIMIT`.
 */

/** Whitelist `ORDER BY` — `project/database-schema.md` §8. */
const SORT_COLUMNS = Object.freeze({ name: 'z.name_ascii' })

const SELECT_COLUMNS = 'id, name, name_ascii, holy_name, note, created_at, updated_at'

/** Cột cho phép cập nhật: camelCase (JS) → snake_case (DB). */
const UPDATABLE = Object.freeze({
  name: 'name',
  nameAscii: 'name_ascii',
  holyName: 'holy_name',
  note: 'note',
})

/**
 * Ranh giới `snake_case` ↔ `camelCase` **kết thúc ở đây** (`data-services.md` §2.3).
 *
 * @param {object | undefined} row
 * @returns {object | null}
 */
export function toDomain(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    nameAscii: row.name_ascii,
    holyName: row.holy_name ?? null,
    note: row.note ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Bản ghi kèm số đếm, dùng cho `zone:list`. */
function toDomainWithCounts(row) {
  return { ...toDomain(row), familyCount: row.family_count, personCount: row.person_count }
}

/** Mệnh đề `WHERE` dùng chung cho `findMany` và `count`. */
function buildFilter(filter = {}) {
  const clauses = ['z.deleted_at IS NULL']
  const params = []

  if (filter.search) {
    clauses.push("z.name_ascii LIKE ? ESCAPE '\\'")
    params.push(likePattern(filter.search))
  }

  return { where: clauses.join(' AND '), params }
}

/** @param {string} id */
export function findById(id) {
  const row = prepare(
    'SELECT ' + SELECT_COLUMNS + ' FROM zones WHERE id = ? AND deleted_at IS NULL',
  ).get(id)

  return toDomain(row)
}

/**
 * Danh sách kèm `familyCount` / `personCount` tính bằng **một** câu `LEFT JOIN` gộp —
 * không lặp `findById` trong vòng lặp (cạm bẫy N+1).
 */
export function findMany(filter = {}) {
  const { where, params } = buildFilter(filter)
  const { limit, offset } = paginate(filter)

  const sql =
    'SELECT z.id, z.name, z.name_ascii, z.holy_name, z.note, z.created_at, z.updated_at,' +
    ' COUNT(DISTINCT f.id) AS family_count,' +
    ' COUNT(DISTINCT fm.person_id) AS person_count' +
    ' FROM zones z' +
    ' LEFT JOIN families f ON f.zone_id = z.id AND f.deleted_at IS NULL' +
    ' LEFT JOIN family_members fm' +
    '   ON fm.family_id = f.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
    ' WHERE ' +
    where +
    ' GROUP BY z.id' +
    ' ORDER BY ' +
    orderBy(SORT_COLUMNS, 'name', filter) +
    ' LIMIT ? OFFSET ?'

  return prepare(sql)
    .all(...params, limit, offset)
    .map(toDomainWithCounts)
}

export function count(filter = {}) {
  const { where, params } = buildFilter(filter)

  return prepare('SELECT COUNT(*) AS total FROM zones z WHERE ' + where).get(...params).total
}

/**
 * @param {{ id: string, name: string, nameAscii: string, holyName: string | null,
 *   note: string | null, createdAt: string, updatedAt: string }} record
 */
export function insert(record) {
  prepare(
    'INSERT INTO zones (id, name, name_ascii, holy_name, note, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    record.id,
    record.name,
    record.nameAscii,
    record.holyName,
    record.note,
    record.createdAt,
    record.updatedAt,
  )

  return findById(record.id)
}

/**
 * Chỉ ghi những cột có mặt trong `patch`. Tên cột lấy từ whitelist `UPDATABLE`, giá trị
 * luôn đi qua `?`.
 */
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
    'UPDATE zones SET ' + assignments.join(', ') + ' WHERE id = ? AND deleted_at IS NULL',
  ).run(...params).changes

  return changed > 0 ? findById(id) : null
}

export function softDelete(id, deletedAt) {
  return (
    prepare(
      'UPDATE zones SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    ).run(deletedAt, deletedAt, id).changes > 0
  )
}

export function hardDelete(id) {
  return prepare('DELETE FROM zones WHERE id = ?').run(id).changes > 0
}

/** Tìm theo tên để Service báo trùng bằng tiếng Việt trước khi DB ném ràng buộc. */
export function findByName(name) {
  return toDomain(
    prepare('SELECT ' + SELECT_COLUMNS + ' FROM zones WHERE name = ? AND deleted_at IS NULL').get(
      name,
    ),
  )
}

export function exists(id) {
  return Boolean(prepare('SELECT 1 AS ok FROM zones WHERE id = ? AND deleted_at IS NULL').get(id))
}

/** Số hộ và số giáo dân hiện hành của một giáo họ — dùng khi xoá và khi xem chi tiết. */
export function countFamiliesAndPersons(zoneId) {
  const row = prepare(
    'SELECT COUNT(DISTINCT f.id) AS family_count, COUNT(DISTINCT fm.person_id) AS person_count' +
      ' FROM families f' +
      ' LEFT JOIN family_members fm' +
      '   ON fm.family_id = f.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' WHERE f.zone_id = ? AND f.deleted_at IS NULL',
  ).get(zoneId)

  return { familyCount: row.family_count, personCount: row.person_count }
}
