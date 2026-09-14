import { invoke, invokeWithMeta } from '@/shared/invoke.ts'

export const familyApi = Object.freeze({
  list: (filter: Record<string, unknown>) => invokeWithMeta(window.api.family.list(filter)),
  getById: (id: string) => invoke(window.api.family.getById(id)),
  create: (input: Record<string, unknown>) => invoke(window.api.family.create(input)),
  update: (input: Record<string, unknown>) => invoke(window.api.family.update(input)),
  remove: (id: string) => invoke(window.api.family.remove(id)),
  bulkMove: (input: Record<string, unknown>) => invoke(window.api.family.bulkMove(input)),
  bulkRemove: (ids: string[]) => invoke(window.api.family.bulkRemove(ids)),
  onChanged: (listener: (payload: unknown) => void) => window.api.events.onFamilyChanged(listener),
})
