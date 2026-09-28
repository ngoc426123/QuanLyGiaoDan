import { invoke, invokeWithMeta } from '@/shared/invoke.ts'

export const suggestionApi = Object.freeze({
  list: (category: string, filter: Record<string, unknown> = {}) =>
    invokeWithMeta(window.api.suggestion.list({ category, page: 1, pageSize: 200, ...filter })),
  create: (input: Record<string, unknown>) => invoke(window.api.suggestion.create(input)),
  update: (input: Record<string, unknown>) => invoke(window.api.suggestion.update(input)),
  remove: (id: string) => invoke(window.api.suggestion.remove(id)),
  onChanged: (listener: (payload: unknown) => void) =>
    window.api.events.onSuggestionChanged(listener),
})
