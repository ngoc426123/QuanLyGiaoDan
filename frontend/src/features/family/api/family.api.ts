import { invoke } from '@/shared/invoke.ts'

export const familyApi = Object.freeze({
  list: (filter: Record<string, unknown>) => invoke(window.api.family.list(filter)),
  getById: (id: string) => invoke(window.api.family.getById(id)),
  create: (input: Record<string, unknown>) => invoke(window.api.family.create(input)),
  update: (input: Record<string, unknown>) => invoke(window.api.family.update(input)),
  remove: (id: string) => invoke(window.api.family.remove(id)),
  onChanged: (listener: (payload: unknown) => void) => window.api.events.onFamilyChanged(listener),
})
