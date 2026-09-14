import { prepare } from './query-helpers.ts'

export function getSummary() {
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
  }
}
