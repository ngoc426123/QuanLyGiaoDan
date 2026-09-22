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

export function findZonesForCsv() {
  return rowsInBatches(
    'SELECT z.name, z.holy_name, z.note, COUNT(DISTINCT f.id) AS family_count,' +
      ' COUNT(DISTINCT fm.person_id) AS person_count FROM zones z' +
      ' LEFT JOIN families f ON f.zone_id = z.id AND f.deleted_at IS NULL' +
      ' LEFT JOIN family_members fm ON fm.family_id = f.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' WHERE z.deleted_at IS NULL GROUP BY z.id ORDER BY z.name_ascii ASC',
  )
}

export function findSacramentsForCsv(filter: any) {
  const clauses = [
    's.deleted_at IS NULL',
    'p.deleted_at IS NULL',
    "s.type IN ('baptism', 'first_communion', 'confirmation')",
  ]
  const params: unknown[] = []
  if (filter.zoneId) {
    clauses.push('z.id = ?')
    params.push(filter.zoneId)
  }
  if (filter.type) {
    clauses.push('s.type = ?')
    params.push(filter.type)
  }
  if (filter.month) {
    clauses.push('s.date >= ? AND s.date < ?')
    params.push(filter.month + '-01', nextMonth(filter.month) + '-01')
  }
  return rowsInBatches(
    'SELECT p.full_name, p.holy_name, s.type, s.date, s.minister, s.place,' +
      ' f.name AS family_name, z.name AS zone_name FROM sacraments s' +
      ' JOIN persons p ON p.id = s.person_id' +
      ' LEFT JOIN family_members fm ON fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' LEFT JOIN families f ON f.id = fm.family_id AND f.deleted_at IS NULL' +
      ' LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL WHERE ' +
      clauses.join(' AND ') +
      ' ORDER BY s.date DESC, p.full_name_ascii ASC',
    params,
  )
}

export function findMarriagesForCsv(filter: any) {
  return rowsInBatches(
    "SELECT m.date, m.minister, m.place, group_concat(mp.full_name, ' và ') AS participants" +
      ' FROM marriages m JOIN marriage_participants mp ON mp.marriage_id = m.id AND mp.deleted_at IS NULL' +
      ' WHERE m.deleted_at IS NULL AND m.date >= ? AND m.date < ?' +
      ' GROUP BY m.id ORDER BY m.date DESC',
    [filter.month + '-01', nextMonth(filter.month) + '-01'],
  )
}

export function findPastoralForCsv(filter: any) {
  const clauses = ['p.deleted_at IS NULL']
  const params: unknown[] = []
  if (filter.zoneId) {
    clauses.push('z.id = ?')
    params.push(filter.zoneId)
  }
  if (filter.residenceStatus) {
    clauses.push('p.residence_status = ?')
    params.push(filter.residenceStatus)
  }
  if (filter.pastoralStatus) {
    clauses.push('p.pastoral_status = ?')
    params.push(filter.pastoralStatus)
  }
  return rowsInBatches(
    'SELECT p.full_name, p.holy_name, p.birth_date, p.phone, p.residence_status, p.pastoral_status,' +
      ' p.pastoral_note, f.name AS family_name, z.name AS zone_name FROM persons p' +
      ' LEFT JOIN family_members fm ON fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' LEFT JOIN families f ON f.id = fm.family_id AND f.deleted_at IS NULL' +
      ' LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL WHERE ' +
      clauses.join(' AND ') +
      ' ORDER BY p.full_name_ascii ASC',
    params,
  )
}

export function findSummaryForCsv() {
  return rowsInBatches(
    'SELECT (SELECT COUNT(*) FROM persons WHERE deleted_at IS NULL) AS person_count,' +
      ' (SELECT COUNT(*) FROM persons WHERE deleted_at IS NULL AND death_date IS NULL) AS living_person_count,' +
      ' (SELECT COUNT(*) FROM persons WHERE deleted_at IS NULL AND death_date IS NOT NULL) AS deceased_person_count,' +
      ' (SELECT COUNT(*) FROM families WHERE deleted_at IS NULL) AS family_count,' +
      ' (SELECT COUNT(*) FROM zones WHERE deleted_at IS NULL) AS zone_count,' +
      ' (SELECT COUNT(*) FROM marriages WHERE deleted_at IS NULL) AS marriage_count',
  )
}

export function findDataQualityForCsv() {
  return rowsInBatches(
    "SELECT p.full_name, 'Thiếu ngày sinh' AS issue, f.name AS family_name, z.name AS zone_name FROM persons p" +
      ' LEFT JOIN family_members fm ON fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' LEFT JOIN families f ON f.id = fm.family_id AND f.deleted_at IS NULL' +
      ' LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL' +
      ' WHERE p.deleted_at IS NULL AND p.birth_date IS NULL UNION ALL' +
      " SELECT p.full_name, 'Chưa thuộc hộ' AS issue, NULL AS family_name, NULL AS zone_name FROM persons p" +
      ' WHERE p.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM family_members fm' +
      ' WHERE fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL) UNION ALL' +
      " SELECT p.full_name, 'Thiếu số điện thoại' AS issue, f.name AS family_name, z.name AS zone_name FROM persons p" +
      ' LEFT JOIN family_members fm ON fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' LEFT JOIN families f ON f.id = fm.family_id AND f.deleted_at IS NULL' +
      ' LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL' +
      " WHERE p.deleted_at IS NULL AND (p.phone IS NULL OR trim(p.phone) = '')" +
      ' ORDER BY full_name ASC',
  )
}

export function findBirthdaysForCsv(filter: any) {
  return rowsInBatches(
    'SELECT p.full_name, p.holy_name, p.birth_date, p.phone, f.name AS family_name, z.name AS zone_name' +
      ' FROM persons p LEFT JOIN family_members fm ON fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' LEFT JOIN families f ON f.id = fm.family_id AND f.deleted_at IS NULL' +
      ' LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL' +
      ' WHERE p.deleted_at IS NULL AND p.death_date IS NULL AND p.birth_date IS NOT NULL' +
      ' AND substr(p.birth_date, 6, 2) = ? ORDER BY substr(p.birth_date, 9, 2), p.full_name_ascii ASC',
    [filter.month.slice(5)],
  )
}

export function findHouseholdMembersForCsv(filter: any) {
  const clauses = ['fm.deleted_at IS NULL', 'fm.to_date IS NULL', 'p.deleted_at IS NULL']
  const params: unknown[] = []
  if (filter.zoneId) {
    clauses.push('z.id = ?')
    params.push(filter.zoneId)
  }
  return rowsInBatches(
    'SELECT f.name AS family_name, z.name AS zone_name, p.full_name, p.holy_name, p.birth_date,' +
      ' fm.relationship, fm.from_date FROM family_members fm' +
      ' JOIN persons p ON p.id = fm.person_id JOIN families f ON f.id = fm.family_id AND f.deleted_at IS NULL' +
      ' JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL WHERE ' +
      clauses.join(' AND ') +
      " ORDER BY z.name_ascii ASC, f.name_ascii ASC, CASE fm.relationship WHEN 'head' THEN 0 ELSE 1 END, p.full_name_ascii ASC",
    params,
  )
}

function nextMonth(month: string) {
  const [year, value] = month.split('-').map(Number)
  return value === 12 ? `${year + 1}-01` : `${year}-${String(value + 1).padStart(2, '0')}`
}
