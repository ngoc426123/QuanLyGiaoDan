import { prepare } from './query-helpers.ts'

const LIST_LIMIT = 12

function nextMonth(month: string) {
  const [year, value] = month.split('-').map(Number)
  return value === 12 ? `${year + 1}-01` : `${year}-${String(value + 1).padStart(2, '0')}`
}

function limitedList(sql: string, params: unknown[] = []) {
  const rows = prepare(sql + ' LIMIT ?').all(...params, LIST_LIMIT)
  const total = prepare('SELECT COUNT(*) AS total FROM (' + sql + ')').get(...params).total
  return { total, rows }
}

export function getSummary(month: string) {
  const next = nextMonth(month)
  const totals = prepare(
    'SELECT (SELECT COUNT(*) FROM persons WHERE deleted_at IS NULL AND death_date IS NULL) AS living_person_count,' +
      ' (SELECT COUNT(*) FROM families WHERE deleted_at IS NULL) AS family_count,' +
      ' (SELECT COUNT(*) FROM zones WHERE deleted_at IS NULL) AS zone_count',
  ).get()
  const zones = prepare(
    'SELECT z.id, z.name, COUNT(DISTINCT f.id) AS family_count, COUNT(DISTINCT fm.person_id) AS person_count' +
      ' FROM zones z LEFT JOIN families f ON f.zone_id = z.id AND f.deleted_at IS NULL' +
      ' LEFT JOIN family_members fm ON fm.family_id = f.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' WHERE z.deleted_at IS NULL GROUP BY z.id ORDER BY z.name_ascii ASC LIMIT 200',
  ).all()
  const familiesWithoutHead = prepare(
    'SELECT f.id, f.name FROM families f WHERE f.deleted_at IS NULL AND NOT EXISTS (' +
      "SELECT 1 FROM family_members fm WHERE fm.family_id = f.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL AND fm.relationship = 'head')" +
      ' ORDER BY f.name_ascii ASC LIMIT 200',
  ).all()
  const personsWithoutFamily = prepare(
    'SELECT p.id, p.full_name AS full_name FROM persons p WHERE p.deleted_at IS NULL AND NOT EXISTS (' +
      'SELECT 1 FROM family_members fm WHERE fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL)' +
      ' ORDER BY p.full_name_ascii ASC LIMIT 200',
  ).all()
  const personsWithoutBirthDate = limitedList(
    'SELECT p.id, p.full_name AS full_name FROM persons p' +
      ' WHERE p.deleted_at IS NULL AND p.birth_date IS NULL' +
      ' ORDER BY p.full_name_ascii ASC',
  )
  const duplicatePhoneRows = prepare(
    'SELECT p.id, p.full_name AS full_name, p.phone FROM persons p' +
      ' JOIN (SELECT phone FROM persons WHERE deleted_at IS NULL AND phone IS NOT NULL' +
      ' GROUP BY phone HAVING COUNT(*) > 1) duplicates ON duplicates.phone = p.phone' +
      ' WHERE p.deleted_at IS NULL ORDER BY p.phone ASC, p.full_name_ascii ASC LIMIT ?',
  ).all(LIST_LIMIT * 2)
  const duplicatePhones = new Map<string, { phone: string; persons: any[] }>()
  for (const row of duplicatePhoneRows) {
    const group = duplicatePhones.get(row.phone) ?? { phone: row.phone, persons: [] }
    group.persons.push({ id: row.id, fullName: row.full_name })
    duplicatePhones.set(row.phone, group)
  }
  const duplicatePhoneCount = prepare(
    'SELECT COUNT(*) AS total FROM (' +
      ' SELECT phone FROM persons WHERE deleted_at IS NULL AND phone IS NOT NULL' +
      ' GROUP BY phone HAVING COUNT(*) > 1)',
  ).get().total
  const birthdays = prepare(
    'SELECT p.id, p.full_name AS full_name, p.birth_date AS birth_date, f.name AS family_name,' +
      ' z.name AS zone_name FROM persons p' +
      ' LEFT JOIN family_members fm ON fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
      ' LEFT JOIN families f ON f.id = fm.family_id AND f.deleted_at IS NULL' +
      ' LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL' +
      ' WHERE p.deleted_at IS NULL AND p.death_date IS NULL AND p.birth_date IS NOT NULL' +
      ' AND substr(p.birth_date, 6, 2) = ?' +
      ' ORDER BY substr(p.birth_date, 9, 2) ASC, p.full_name_ascii ASC LIMIT ?',
  ).all(month.slice(5), LIST_LIMIT)
  const sacramentCounts = prepare(
    "SELECT SUM(type = 'baptism') AS baptism_count," +
      " SUM(type = 'first_communion') AS first_communion_count," +
      " SUM(type = 'confirmation') AS confirmation_count" +
      ' FROM sacraments WHERE deleted_at IS NULL AND date >= ? AND date < ?',
  ).get(month + '-01', next + '-01')
  const monthlyCounts = prepare(
    'SELECT' +
      ' (SELECT COUNT(*) FROM persons WHERE deleted_at IS NULL AND death_date >= ? AND death_date < ?) AS death_count,' +
      ' (SELECT COUNT(*) FROM marriages WHERE deleted_at IS NULL AND date >= ? AND date < ?) AS marriage_count',
  ).get(month + '-01', next + '-01', month + '-01', next + '-01')
  return {
    livingPersonCount: totals.living_person_count,
    familyCount: totals.family_count,
    zoneCount: totals.zone_count,
    zones: zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      familyCount: zone.family_count,
      personCount: zone.person_count,
    })),
    familiesWithoutHead: familiesWithoutHead.map((family) => ({
      id: family.id,
      name: family.name,
    })),
    personsWithoutFamily: personsWithoutFamily.map((person) => ({
      id: person.id,
      fullName: person.full_name,
    })),
    pastoral: {
      month,
      birthdays: birthdays.map((person) => ({
        id: person.id,
        fullName: person.full_name,
        birthDate: person.birth_date,
        familyName: person.family_name ?? null,
        zoneName: person.zone_name ?? null,
      })),
      counts: {
        baptisms: sacramentCounts.baptism_count ?? 0,
        firstCommunions: sacramentCounts.first_communion_count ?? 0,
        confirmations: sacramentCounts.confirmation_count ?? 0,
        marriages: monthlyCounts.marriage_count,
        deaths: monthlyCounts.death_count,
      },
    },
    dataQuality: {
      personsWithoutBirthDate: {
        total: personsWithoutBirthDate.total,
        records: personsWithoutBirthDate.rows.map((person) => ({
          id: person.id,
          fullName: person.full_name,
        })),
      },
      duplicatePhones: {
        total: duplicatePhoneCount,
        groups: Array.from(duplicatePhones.values()),
      },
    },
  }
}
