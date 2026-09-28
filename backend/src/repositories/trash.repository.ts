import { prepare } from './query-helpers.ts'
import * as marriageRepository from './marriage.repository.ts'
import * as sacramentRepository from './sacrament.repository.ts'
import * as personParentRepository from './person-parent.repository.ts'

const RESTORE_SQL = Object.freeze({
  zone: 'UPDATE zones SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL',
  family:
    'UPDATE families SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL',
  person:
    'UPDATE persons SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL',
  family_member:
    'UPDATE family_members SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL',
})
const HARD_REMOVE_SQL = Object.freeze({
  zone: 'DELETE FROM zones WHERE id = ? AND deleted_at IS NOT NULL',
  family: 'DELETE FROM families WHERE id = ? AND deleted_at IS NOT NULL',
  person: 'DELETE FROM persons WHERE id = ? AND deleted_at IS NOT NULL',
  family_member: 'DELETE FROM family_members WHERE id = ? AND deleted_at IS NOT NULL',
})

export function findMany() {
  return prepare(
    "SELECT id, 'zone' AS type, name AS title, deleted_at FROM zones WHERE deleted_at IS NOT NULL" +
      " UNION ALL SELECT id, 'family', name, deleted_at FROM families WHERE deleted_at IS NOT NULL" +
      " UNION ALL SELECT id, 'person', full_name, deleted_at FROM persons WHERE deleted_at IS NOT NULL" +
      " UNION ALL SELECT id, 'marriage', 'Hôn phối ngày ' || date, deleted_at FROM marriages WHERE deleted_at IS NOT NULL" +
      " UNION ALL SELECT fm.id, 'family_member', COALESCE(p.full_name, 'Giáo dân') || ' - ' || COALESCE(f.name, 'Hộ gia đình'), fm.deleted_at FROM family_members fm LEFT JOIN persons p ON p.id = fm.person_id LEFT JOIN families f ON f.id = fm.family_id WHERE fm.deleted_at IS NOT NULL AND p.deleted_at IS NULL AND f.deleted_at IS NULL" +
      ' ORDER BY deleted_at DESC LIMIT 200',
  ).all()
}

export function restore(type: string, id: string, updatedAt: string, deletedAt?: string) {
  if (type === 'marriage') {
    const restoredParticipants = prepare(
      'UPDATE marriage_participants SET deleted_at = NULL, updated_at = ?' +
        ' WHERE marriage_id = ? AND deleted_at = (' +
        ' SELECT deleted_at FROM marriages WHERE id = ? AND deleted_at IS NOT NULL)',
    ).run(updatedAt, id, id).changes
    const restored =
      prepare(
        'UPDATE marriages SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL',
      ).run(updatedAt, id).changes > 0
    if (!restored && restoredParticipants) throw new Error('Không thể khôi phục hôn phối')
    return restored
  }
  const restored = prepare(RESTORE_SQL[type]).run(updatedAt, id).changes > 0
  if (restored && type === 'person' && deletedAt) {
    sacramentRepository.restoreByPersonId(id, deletedAt, updatedAt)
    marriageRepository.restoreByPersonId(id, deletedAt, updatedAt)
    personParentRepository.restoreByPersonId(id, deletedAt, updatedAt)
  }
  return restored
}

export function findDeletedFamily(id: string) {
  return prepare('SELECT zone_id FROM families WHERE id = ? AND deleted_at IS NOT NULL').get(id)
}

export function isLiveZone(id: string) {
  return Boolean(prepare('SELECT 1 FROM zones WHERE id = ? AND deleted_at IS NULL').get(id))
}

export function findDeletedFamilyMember(id: string) {
  return prepare(
    'SELECT family_id, person_id, relationship, to_date FROM family_members WHERE id = ? AND deleted_at IS NOT NULL',
  ).get(id)
}

export function isLiveFamily(id: string) {
  return Boolean(prepare('SELECT 1 FROM families WHERE id = ? AND deleted_at IS NULL').get(id))
}

export function isLivePerson(id: string) {
  return Boolean(prepare('SELECT 1 FROM persons WHERE id = ? AND deleted_at IS NULL').get(id))
}

export function hasCurrentMembership(personId: string) {
  return Boolean(
    prepare(
      'SELECT 1 FROM family_members WHERE person_id = ? AND to_date IS NULL AND deleted_at IS NULL',
    ).get(personId),
  )
}

export function hasCurrentHead(familyId: string) {
  return Boolean(
    prepare(
      "SELECT 1 FROM family_members WHERE family_id = ? AND relationship = 'head' AND to_date IS NULL AND deleted_at IS NULL",
    ).get(familyId),
  )
}

export function findDeletedMarriageParticipantIds(id: string) {
  return prepare(
    'SELECT person_id FROM marriage_participants WHERE marriage_id = ? AND deleted_at IS NOT NULL',
  ).all(id)
}

export function hardRemove(type: string, id: string) {
  if (type === 'marriage') {
    prepare(
      'DELETE FROM marriage_participants WHERE marriage_id = ?' +
        ' AND EXISTS (SELECT 1 FROM marriages WHERE id = ? AND deleted_at IS NOT NULL)',
    ).run(id, id)
    return (
      prepare('DELETE FROM marriages WHERE id = ? AND deleted_at IS NOT NULL').run(id).changes > 0
    )
  }
  if (type === 'person') {
    sacramentRepository.hardDeleteByPersonId(id)
    marriageRepository.hardDeleteByPersonId(id)
    personParentRepository.hardDeleteByPersonId(id)
  }
  return prepare(HARD_REMOVE_SQL[type]).run(id).changes > 0
}

export function empty() {
  prepare('DELETE FROM family_members WHERE deleted_at IS NOT NULL').run()
  prepare(
    'DELETE FROM person_parents WHERE deleted_at IS NOT NULL OR child_person_id IN (SELECT id FROM persons WHERE deleted_at IS NOT NULL) OR parent_person_id IN (SELECT id FROM persons WHERE deleted_at IS NOT NULL)',
  ).run()
  prepare('DELETE FROM sacraments WHERE deleted_at IS NOT NULL').run()
  prepare('DELETE FROM marriage_participants WHERE deleted_at IS NOT NULL').run()
  prepare('DELETE FROM marriages WHERE deleted_at IS NOT NULL').run()
  prepare('DELETE FROM persons WHERE deleted_at IS NOT NULL').run()
  prepare('DELETE FROM families WHERE deleted_at IS NOT NULL').run()
  return prepare('DELETE FROM zones WHERE deleted_at IS NOT NULL').run().changes
}

export function purgeBefore(cutoff: string) {
  prepare(
    'DELETE FROM family_members WHERE deleted_at IS NOT NULL AND (deleted_at < ? OR person_id IN (SELECT id FROM persons WHERE deleted_at < ?) OR family_id IN (SELECT id FROM families WHERE deleted_at < ?))',
  ).run(cutoff, cutoff, cutoff)
  prepare(
    'DELETE FROM person_parents WHERE deleted_at < ? OR child_person_id IN (SELECT id FROM persons WHERE deleted_at < ?) OR parent_person_id IN (SELECT id FROM persons WHERE deleted_at < ?)',
  ).run(cutoff, cutoff, cutoff)
  prepare(
    'DELETE FROM sacraments WHERE deleted_at IS NOT NULL AND (deleted_at < ? OR person_id IN (SELECT id FROM persons WHERE deleted_at < ?))',
  ).run(cutoff, cutoff)
  prepare(
    'DELETE FROM marriage_participants WHERE deleted_at IS NOT NULL AND (' +
      'deleted_at < ? OR person_id IN (SELECT id FROM persons WHERE deleted_at < ?) OR ' +
      'marriage_id IN (SELECT id FROM marriages WHERE deleted_at < ?))',
  ).run(cutoff, cutoff, cutoff)
  prepare('DELETE FROM marriages WHERE deleted_at < ?').run(cutoff)
  prepare('DELETE FROM persons WHERE deleted_at < ?').run(cutoff)
  prepare('DELETE FROM families WHERE deleted_at < ?').run(cutoff)
  return prepare('DELETE FROM zones WHERE deleted_at < ?').run(cutoff).changes
}
