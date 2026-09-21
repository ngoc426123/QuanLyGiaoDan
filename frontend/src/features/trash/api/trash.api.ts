import { invoke } from '@/shared/invoke.ts'

export const trashApi = Object.freeze({
  list: () => invoke(window.api.trash.list()),
  restore: (input: Record<string, string>) =>
    invoke(window.api.trash.restore({ type: input.type, id: input.id })),
  hardRemove: (input: Record<string, string>) =>
    invoke(window.api.trash.hardRemove({ type: input.type, id: input.id })),
  empty: () => invoke(window.api.trash.empty()),
})
