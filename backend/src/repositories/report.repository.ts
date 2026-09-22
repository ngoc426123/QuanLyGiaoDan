import { likePattern, prepare } from './query-helpers.ts'

const BATCH_SIZE = 500

function rowsInBatches(sql: string, params: unknown[] = []) {
  const rows: unknown[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const batch = prepare(sql + ' LIMIT ? OFFSET ?').all(...params, BATCH_SIZE, offset)
    rows.push(...batch)
    hasMore = batch.length === BATCH_SIZE
    offset += BATCH_SIZE
  }

  return rows
}

export function findPersonsForCsv(filter: any) {
  const clauses = ['p.deleted_at IS NULL']
  const params: unknown[] = []

  if (filter.zoneId) {
    clauses.push('z.id = ?')
    params.push(filter.zoneId)
  }
  if (filter.familyId) {
    clauses.push('f.id = ?')
    params.push(filter.familyId)
  }
  if (filter.gender) {
    clauses.push('p.gender = ?')
    params.push(filter.gender)
  }
  if (filter.isAlive === true) clauses.push('p.death_date IS NULL')
  if (filter.isAlive === false) clauses.push('p.death_date IS NOT NULL')
  if (filter.search) {
    clauses.push("p.full_name_ascii LIKE ? ESCAPE '\\'")
    params.push(likePattern(filter.search))
  }

  return rowsInBatches(
    'SELECT p.full_name AS full_name, p.holy_name AS holy_name, p.gender, p.birth_date AS birth_date,' +
      " (SELECT date FROM sacraments s WHERE s.person_id = p.id AND s.type = 'baptism' AND s.deleted_at IS NULL) AS baptism_date," +
      " (SELECT date FROM sacraments s WHERE s.person_id = p.id AND s.type = 'first_communion' AND s.deleted_at IS NULL) AS first_communion_date," +
      " (SELECT date FROM sacraments s WHERE s.person_id = p.id AND s.type = 'confirmation' AND s.deleted_at IS NULL) AS confirmation_date," +
      " (SELECT date FROM sacraments s WHERE s.person_id = p.id AND s.type = 'marriage' AND s.deleted_at IS NULL) AS marriage_date," +
      ' p.death_date AS death_date, p.phone, p.note, f.name AS family_name, z.name AS zone_name' +
      ' FROM persons p' +
      ' LEFT JOIN family_members fm ON fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' LEFT JOIN families f ON f.id = fm.family_id AND f.deleted_at IS NULL' +
      ' LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL' +
      ' WHERE ' +
      clauses.join(' AND ') +
      ' ORDER BY p.given_name_ascii ASC, p.full_name_ascii ASC',
    params,
  )
}

export function findFamiliesForCsv(filter: any) {
  const clauses = ['f.deleted_at IS NULL']
  const params: unknown[] = []

  if (filter.zoneId) {
    clauses.push('z.id = ?')
    params.push(filter.zoneId)
  }
  if (filter.search) {
    clauses.push("f.name_ascii LIKE ? ESCAPE '\\'")
    params.push(likePattern(filter.search))
  }

  return rowsInBatches(
    'SELECT f.name, z.name AS zone_name, f.address, f.note,' +
      ' COUNT(fm.id) AS member_count' +
      ' FROM families f JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL' +
      ' LEFT JOIN family_members fm ON fm.family_id = f.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' WHERE ' +
      clauses.join(' AND ') +
      ' GROUP BY f.id ORDER BY f.name_ascii ASC',
    params,
  )
}

export function findFamilyMembersForCsv(familyId: string) {
  return rowsInBatches(
    'SELECT p.full_name AS full_name, p.holy_name AS holy_name, p.gender,' +
      ' p.birth_date AS birth_date, fm.relationship, fm.from_date AS from_date, fm.note' +
      ' FROM family_members fm JOIN persons p ON p.id = fm.person_id AND p.deleted_at IS NULL' +
      ' WHERE fm.family_id = ? AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      " ORDER BY CASE fm.relationship WHEN 'head' THEN 0 ELSE 1 END, p.full_name_ascii ASC",
    [familyId],
  )
}
