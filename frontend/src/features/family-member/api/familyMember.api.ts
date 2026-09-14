import { invoke } from '@/shared/invoke.ts'

export const familyMemberApi = Object.freeze({
  add: (input: Record<string, unknown>) => invoke(window.api.familyMember.add(input)),
  update: (input: Record<string, unknown>) => invoke(window.api.familyMember.update(input)),
  move: (input: Record<string, unknown>) => invoke(window.api.familyMember.move(input)),
  remove: (id: string) => invoke(window.api.familyMember.remove(id)),
})
