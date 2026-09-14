import { invoke, invokeWithMeta } from '@/shared/invoke.ts'

export const personApi = Object.freeze({
  list: (filter: Record<string, unknown>) => invokeWithMeta(window.api.person.list(filter)),
  getById: (id: string) => invoke(window.api.person.getById(id)),
  create: (input: Record<string, unknown>) => invokeWithMeta(window.api.person.create(input)),
  update: (input: Record<string, unknown>) => invokeWithMeta(window.api.person.update(input)),
  remove: (id: string) => invoke(window.api.person.remove(id)),
  onChanged: (listener: (payload: unknown) => void) => window.api.events.onPersonChanged(listener),
})
