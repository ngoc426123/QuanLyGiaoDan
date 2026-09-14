import { likePattern, orderBy, paginate, prepare } from './query-helpers.js'

/** Repository của `persons`. Nơi duy nhất viết SQL cho giáo dân. */

/** Whitelist `ORDER BY` — `project/database-schema.md` §8. */
const SORT_COLUMNS = Object.freeze({
  givenName: 'p.given_name_ascii',
  fullNameAscii: 'p.full_name_ascii',
  birthDate: 'p.birth_date',
})

const SELECT_COLUMNS =
  'p.id, p.full_name, p.given_name, p.full_name_ascii, p.given_name_ascii,' +
  ' p.holy_name, p.gender,' +
  ' p.birth_date, p.baptism_date, p.first_communion_date, p.confirmation_date,' +
  ' p.marriage_date, p.death_date, p.phone, p.note, p.created_at, p.updated_at'

const UPDATABLE = Object.freeze({
  fullName: 'full_name',
  givenName: 'given_name',
  fullNameAscii: 'full_name_ascii',
  givenNameAscii: 'given_name_ascii',
  holyName: 'holy_name',
  gender: 'gender',
  birthDate: 'birth_date',
  baptismDate: 'baptism_date',
  firstCommunionDate: 'first_communion_date',
  confirmationDate: 'confirmation_date',
  marriageDate: 'marriage_date',
  deathDate: 'death_date',
  phone: 'phone',
  note: 'note',
})

/**
 * Hộ hiện hành và giáo họ **suy ra** qua `family_members` → `families.zone_id`
 * (`project/database-schema.md` §1) — không có cột trực tiếp. `LEFT JOIN` vì người có thể
 * chưa thuộc hộ nào.
 */
const CURRENT_MEMBERSHIP_JOIN =
  ' LEFT JOIN family_members fm' +
  '   ON fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
  ' LEFT JOIN families f ON f.id = fm.family_id AND f.deleted_at IS NULL' +
  ' LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL'

const JOINED_COLUMNS =
  ' f.id AS family_id, f.name AS family_name, z.id AS zone_id, z.name AS zone_name'

export function toDomain(row) {
  if (!row) return null

  return {
    id: row.id,
    fullName: row.full_name,
    givenName: row.given_name ?? null,
    fullNameAscii: row.full_name_ascii,
    givenNameAscii: row.given_name_ascii ?? null,
    holyName: row.holy_name ?? null,
    gender: row.gender ?? null,
    birthDate: row.birth_date ?? null,
    baptismDate: row.baptism_date ?? null,
    firstCommunionDate: row.first_communion_date ?? null,
    confirmationDate: row.confirmation_date ?? null,
    marriageDate: row.marriage_date ?? null,
    deathDate: row.death_date ?? null,
    phone: row.phone ?? null,
    note: row.note ?? null,
    isAlive: row.death_date === null || row.death_date === undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.family_id === undefined ? {} : { familyId: row.family_id ?? null }),
    ...(row.family_name === undefined ? {} : { familyName: row.family_name ?? null }),
    ...(row.zone_id === undefined ? {} : { zoneId: row.zone_id ?? null }),
    ...(row.zone_name === undefined ? {} : { zoneName: row.zone_name ?? null }),
  }
}

function buildFilter(filter = {}) {
  const clauses = ['p.deleted_at IS NULL']
  const params = []

  if (filter.familyId) {
    clauses.push('f.id = ?')
    params.push(filter.familyId)
  }

  if (filter.zoneId) {
    clauses.push('z.id = ?')
    params.push(filter.zoneId)
  }

  if (filter.gender) {
    clauses.push('p.gender = ?')
    params.push(filter.gender)
  }

  if (filter.isAlive === true) clauses.push('p.death_date IS NULL')
  if (filter.isAlive === false) clauses.push('p.death_date IS NOT NULL')

  if (filter.search) {
    // Tìm trên cột đã bỏ dấu: gõ "nguyen van an" vẫn ra "Nguyễn Văn An".
    clauses.push("p.full_name_ascii LIKE ? ESCAPE '\\'")
    params.push(likePattern(filter.search))
  }

  return { where: clauses.join(' AND '), params }
}

export function findById(id) {
  const row = prepare(
    'SELECT ' +
      SELECT_COLUMNS +
      ',' +
      JOINED_COLUMNS +
      ' FROM persons p' +
      CURRENT_MEMBERSHIP_JOIN +
      ' WHERE p.id = ? AND p.deleted_at IS NULL',
  ).get(id)

  return toDomain(row)
}

/** Không join — dùng cho kiểm tra tiền điều kiện bên trong transaction. */
export function findRawById(id) {
  return toDomain(
    prepare(
      'SELECT ' + SELECT_COLUMNS + ' FROM persons p WHERE p.id = ? AND p.deleted_at IS NULL',
    ).get(id),
  )
}

export function findMany(filter = {}) {
  const { where, params } = buildFilter(filter)
  const { limit, offset } = paginate(filter)

  const sql =
    'SELECT ' +
    SELECT_COLUMNS +
    ',' +
    JOINED_COLUMNS +
    ' FROM persons p' +
    CURRENT_MEMBERSHIP_JOIN +
    ' WHERE ' +
    where +
    ' ORDER BY ' +
    orderBy(SORT_COLUMNS, 'givenName', filter) +
    ' LIMIT ? OFFSET ?'

  return prepare(sql)
    .all(...params, limit, offset)
    .map(toDomain)
}

export function count(filter = {}) {
  const { where, params } = buildFilter(filter)

  return prepare(
    'SELECT COUNT(*) AS total FROM persons p' + CURRENT_MEMBERSHIP_JOIN + ' WHERE ' + where,
  ).get(...params).total
}

export function insert(record) {
  prepare(
    'INSERT INTO persons (id, full_name, given_name, full_name_ascii, given_name_ascii,' +
      ' holy_name, gender,' +
      ' birth_date, baptism_date, first_communion_date, confirmation_date, marriage_date,' +
      ' death_date, phone, note, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    record.id,
    record.fullName,
    record.givenName,
    record.fullNameAscii,
    record.givenNameAscii,
    record.holyName,
    record.gender,
    record.birthDate,
    record.baptismDate,
    record.firstCommunionDate,
    record.confirmationDate,
    record.marriageDate,
    record.deathDate,
    record.phone,
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
    'UPDATE persons SET ' + assignments.join(', ') + ' WHERE id = ? AND deleted_at IS NULL',
  ).run(...params).changes

  return changed > 0 ? findById(id) : null
}

export function softDelete(id, deletedAt) {
  return (
    prepare(
      'UPDATE persons SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    ).run(deletedAt, deletedAt, id).changes > 0
  )
}

export function hardDelete(id) {
  return prepare('DELETE FROM persons WHERE id = ?').run(id).changes > 0
}

export function exists(id) {
  return Boolean(prepare('SELECT 1 AS ok FROM persons WHERE id = ? AND deleted_at IS NULL').get(id))
}
