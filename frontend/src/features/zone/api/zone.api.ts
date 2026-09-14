import { invoke, invokeWithMeta } from '@/shared/invoke.ts'

export const zoneApi = Object.freeze({
  list: (filter: Record<string, unknown>) => invokeWithMeta(window.api.zone.list(filter)),
  getById: (id: string) => invoke(window.api.zone.getById(id)),
  create: (input: Record<string, unknown>) => invoke(window.api.zone.create(input)),
  update: (input: Record<string, unknown>) => invoke(window.api.zone.update(input)),
  remove: (id: string) => invoke(window.api.zone.remove(id)),
  onChanged: (listener: (payload: unknown) => void) => window.api.events.onZoneChanged(listener),
})
