import * as activityLogRepository from '#/repositories/activity-log.repository.ts'
import { newId } from './service-helpers.ts'

const AUDIT_FIELDS = Object.freeze({
  zone: ['name', 'holyName', 'note'],
  family: ['zoneId', 'name', 'address', 'note'],
  person: [
    'fullName',
    'givenName',
    'holyName',
    'gender',
    'birthDate',
    'deathDate',
    'phone',
    'email',
    'secondaryPhone',
    'residenceStatus',
    'pastoralStatus',
    'source',
    'personType',
    'parishName',
    'dioceseName',
    'fatherName',
    'motherName',
    'parents',
    'sacraments',
    'note',
  ],
  family_member: ['familyId', 'personId', 'relationship', 'fromDate', 'toDate', 'note'],
})

export function record({ entityType, entityId, action, before, after, timestamp }: any) {
  const changes = action === 'updated' ? changedFields(entityType, before, after) : {}
  activityLogRepository.insert({
    id: newId(),
    entityType,
    entityId,
    action,
    changes: JSON.stringify(changes),
    createdAt: timestamp,
  })
}

export function list({ entityType, entityId }: any) {
  return activityLogRepository.findByEntity(entityType, entityId).map((row: any) => ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    changes: JSON.parse(row.changes),
    createdAt: row.created_at,
  }))
}

function changedFields(entityType: string, before: any, after: any) {
  const changes: Record<string, [unknown, unknown]> = {}
  for (const field of AUDIT_FIELDS[entityType] ?? []) {
    if (before?.[field] !== after?.[field])
      changes[field] = [before?.[field] ?? null, after?.[field] ?? null]
  }
  return changes
}
