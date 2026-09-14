import { invoke } from '@/shared/invoke.ts'

export const trashApi = Object.freeze({
  list: () => invoke(window.api.trash.list()),
  restore: (input: Record<string, string>) => invoke(window.api.trash.restore(input)),
  hardRemove: (input: Record<string, string>) => invoke(window.api.trash.hardRemove(input)),
  empty: () => invoke(window.api.trash.empty()),
})
