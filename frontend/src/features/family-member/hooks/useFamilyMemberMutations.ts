import { useMutation, useQueryClient } from '@tanstack/react-query'
import { familyKeys, personKeys, zoneKeys } from '@/shared/queryKeys.ts'
import { familyMemberApi } from '../api/familyMember.api.ts'
import type { FamilyMember } from '../familyMember.types.ts'

export function useAddFamilyMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: familyMemberApi.add,
    onSuccess: (_data, input: { familyId: string; personId: string }) => {
      client.invalidateQueries({ queryKey: familyKeys.detail(input.familyId) })
      client.invalidateQueries({ queryKey: personKeys.detail(input.personId) })
      client.invalidateQueries({ queryKey: personKeys.lists })
      client.invalidateQueries({ queryKey: familyKeys.lists })
    },
  })
}

export function useUpdateFamilyMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: familyMemberApi.update,
    onSuccess: (member: FamilyMember) => {
      client.invalidateQueries({ queryKey: familyKeys.detail(member.familyId) })
      client.invalidateQueries({ queryKey: personKeys.detail(member.personId) })
    },
  })
}

export function useMoveFamilyMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: familyMemberApi.move,
    onSuccess: (
      data: { closed: FamilyMember; opened: FamilyMember },
      input: { personId: string },
    ) => {
      client.invalidateQueries({ queryKey: familyKeys.detail(data.closed.familyId) })
      client.invalidateQueries({ queryKey: familyKeys.detail(data.opened.familyId) })
      client.invalidateQueries({ queryKey: personKeys.detail(input.personId) })
      client.invalidateQueries({ queryKey: personKeys.lists })
      client.invalidateQueries({ queryKey: familyKeys.lists })
      client.invalidateQueries({ queryKey: zoneKeys.lists })
    },
  })
}

export function useRemoveFamilyMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: familyMemberApi.remove,
    onSuccess: (data: { familyId?: string; personId?: string }) => {
      if (data.familyId) client.invalidateQueries({ queryKey: familyKeys.detail(data.familyId) })
      if (data.personId) client.invalidateQueries({ queryKey: personKeys.detail(data.personId) })
      client.invalidateQueries({ queryKey: personKeys.lists })
      client.invalidateQueries({ queryKey: familyKeys.lists })
    },
  })
}
