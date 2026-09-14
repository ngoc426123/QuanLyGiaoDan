import { PAGE_SIZE_MAX } from '@shared/constants.ts'
import { prepare } from './query-helpers.ts'

/**
 * Repository của `family_members`. Nơi duy nhất viết SQL cho quan hệ người–hộ.
 *
 * `to_date IS NULL` nghĩa là **hiện hành**. Hai partial unique index của bảng
 * (`uq_family_members_current`, `uq_family_members_head`) là lưới an toàn cuối — Service
 * vẫn phải kiểm tra trước để trả `CONFLICT` bằng tiếng Việt.
 */

const SELECT_COLUMNS =
  'fm.id, fm.family_id, fm.person_id, fm.relationship, fm.from_date, fm.to_date,' +
  ' fm.note, fm.created_at, fm.updated_at'

const UPDATABLE = Object.freeze({
  relationship: 'relationship',
  fromDate: 'from_date',
  toDate: 'to_date',
  note: 'note',
})

export function toDomain(row) {
  if (!row) return null

  return {
    id: row.id,
    familyId: row.family_id,
    personId: row.person_id,
    relationship: row.relationship,
    fromDate: row.from_date,
    toDate: row.to_date ?? null,
    isCurrent: row.to_date === null || row.to_date === undefined,
    note: row.note ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.person_full_name === undefined
      ? {}
      : {
          personFullName: row.person_full_name,
          personGivenName: row.person_given_name ?? null,
          personHolyName: row.person_holy_name ?? null,
          personGender: row.person_gender ?? null,
          personBirthDate: row.person_birth_date ?? null,
        }),
    ...(row.family_name === undefined ? {} : { familyName: row.family_name }),
  }
}

/** Cột của người, kèm theo khi lấy danh sách thành viên của một hộ. */
const PERSON_COLUMNS =
  ' p.full_name AS person_full_name, p.given_name AS person_given_name,' +
  ' p.holy_name AS person_holy_name, p.gender AS person_gender,' +
  ' p.birth_date AS person_birth_date'

export function findById(id) {
  return toDomain(
    prepare(
      'SELECT ' +
        SELECT_COLUMNS +
        ' FROM family_members fm WHERE fm.id = ? AND fm.deleted_at IS NULL',
    ).get(id),
  )
}

/** Hộ **hiện hành** của một người. `null` nghĩa là người chưa thuộc hộ nào. */
export function findCurrentByPersonId(personId) {
  return toDomain(
    prepare(
      'SELECT ' +
        SELECT_COLUMNS +
        ', f.name AS family_name' +
        ' FROM family_members fm' +
        ' JOIN families f ON f.id = fm.family_id' +
        ' WHERE fm.person_id = ? AND fm.deleted_at IS NULL AND fm.to_date IS NULL',
    ).get(personId),
  )
}

/** Chủ hộ đang tại vị của một hộ. `null` nghĩa là hộ chưa có chủ hộ. */
export function findCurrentHeadByFamilyId(familyId) {
  return toDomain(
    prepare(
      'SELECT ' +
        SELECT_COLUMNS +
        ' FROM family_members fm' +
        " WHERE fm.family_id = ? AND fm.relationship = 'head'" +
        ' AND fm.deleted_at IS NULL AND fm.to_date IS NULL',
    ).get(familyId),
  )
}

/**
 * Thành viên của một hộ, kèm thông tin người để màn hình chi tiết không phải gọi thêm.
 *
 * @param {string} familyId
 * @param {{ includeHistory?: boolean }} [options] Mặc định chỉ lấy thành viên hiện hành
 */
export function findByFamilyId(familyId, options: any = {}) {
  const currentOnly = options.includeHistory ? '' : ' AND fm.to_date IS NULL'

  return prepare(
    'SELECT ' +
      SELECT_COLUMNS +
      ',' +
      PERSON_COLUMNS +
      ' FROM family_members fm' +
      ' JOIN persons p ON p.id = fm.person_id AND p.deleted_at IS NULL' +
      ' WHERE fm.family_id = ? AND fm.deleted_at IS NULL' +
      currentOnly +
      ' ORDER BY fm.to_date IS NOT NULL, fm.from_date ASC' +
      ' LIMIT ?',
  )
    .all(familyId, PAGE_SIZE_MAX)
    .map(toDomain)
}

/** Lịch sử chuyển hộ của một người, mới nhất trước. */
export function findHistoryByPersonId(personId) {
  return prepare(
    'SELECT ' +
      SELECT_COLUMNS +
      ', f.name AS family_name' +
      ' FROM family_members fm' +
      ' JOIN families f ON f.id = fm.family_id' +
      ' WHERE fm.person_id = ? AND fm.deleted_at IS NULL' +
      ' ORDER BY fm.from_date DESC' +
      ' LIMIT ?',
  )
    .all(personId, PAGE_SIZE_MAX)
    .map(toDomain)
}

export function insert(record) {
  prepare(
    'INSERT INTO family_members (id, family_id, person_id, relationship, from_date, to_date,' +
      ' note, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    record.id,
    record.familyId,
    record.personId,
    record.relationship,
    record.fromDate,
    record.toDate,
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
    'UPDATE family_members SET ' + assignments.join(', ') + ' WHERE id = ? AND deleted_at IS NULL',
  ).run(...params).changes

  return changed > 0 ? findById(id) : null
}

/**
 * Đóng dòng hiện hành của một người — nửa đầu của thao tác chuyển hộ.
 * Service gọi trong cùng transaction với việc mở dòng mới.
 *
 * @returns {number} Số dòng bị đóng (0 nghĩa là người chưa thuộc hộ nào)
 */
export function closeCurrent(personId, toDate, updatedAt) {
  return prepare(
    'UPDATE family_members SET to_date = ?, updated_at = ?' +
      ' WHERE person_id = ? AND deleted_at IS NULL AND to_date IS NULL',
  ).run(toDate, updatedAt, personId).changes
}

export function softDelete(id, deletedAt) {
  return (
    prepare(
      'UPDATE family_members SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
    ).run(deletedAt, deletedAt, id).changes > 0
  )
}

/** Xoá mềm dòng hiện hành của một người — dùng khi xoá mềm chính người đó. */
export function softDeleteCurrentByPersonId(personId, deletedAt) {
  return prepare(
    'UPDATE family_members SET deleted_at = ?, updated_at = ?' +
      ' WHERE person_id = ? AND deleted_at IS NULL AND to_date IS NULL',
  ).run(deletedAt, deletedAt, personId).changes
}

export function softDeleteCurrentByPersonIds(personIds, deletedAt) {
  return prepare(
    'UPDATE family_members SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL AND to_date IS NULL AND person_id IN (SELECT value FROM json_each(?))',
  ).run(deletedAt, deletedAt, JSON.stringify(personIds)).changes
}

export function closeCurrentByPersonIds(personIds, toDate, updatedAt) {
  return prepare(
    'UPDATE family_members SET to_date = ?, updated_at = ? WHERE deleted_at IS NULL AND to_date IS NULL AND person_id IN (SELECT value FROM json_each(?))',
  ).run(toDate, updatedAt, JSON.stringify(personIds)).changes
}

export function findCurrentByPersonIds(personIds) {
  return prepare(
    'SELECT person_id, from_date FROM family_members WHERE deleted_at IS NULL AND to_date IS NULL AND person_id IN (SELECT value FROM json_each(?))',
  ).all(JSON.stringify(personIds))
}

export function insertMany(records) {
  const statement = prepare(
    'INSERT INTO family_members (id, family_id, person_id, relationship, from_date, to_date,' +
      ' note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
  for (const record of records) {
    statement.run(
      record.id,
      record.familyId,
      record.personId,
      record.relationship,
      record.fromDate,
      record.toDate,
      record.note,
      record.createdAt,
      record.updatedAt,
    )
  }
  return records.length
}

export function hardDelete(id) {
  return prepare('DELETE FROM family_members WHERE id = ?').run(id).changes > 0
}

export function exists(id) {
  return Boolean(
    prepare('SELECT 1 AS ok FROM family_members WHERE id = ? AND deleted_at IS NULL').get(id),
  )
}
