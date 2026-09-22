import { useMutation, useQueryClient } from '@tanstack/react-query'
import { familyKeys, personKeys, zoneKeys } from '@/shared/queryKeys.ts'
import { personApi } from '../api/person.api.ts'

function useCreateInvalidation() {
  const client = useQueryClient()
  return async () => {
    client.invalidateQueries({ queryKey: personKeys.lists })
    client.invalidateQueries({ queryKey: familyKeys.lists })
    client.invalidateQueries({ queryKey: zoneKeys.lists })
    await client.refetchQueries({ queryKey: personKeys.lists, type: 'active' })
  }
}

export function useCreatePerson() {
  const invalidate = useCreateInvalidation()
  return useMutation({ mutationFn: personApi.create, onSuccess: invalidate })
}

export function useUpdatePerson() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: personApi.update,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: personKeys.all })
    },
  })
}

export function useRemovePerson() {
  const client = useQueryClient()
  const invalidate = useCreateInvalidation()
  return useMutation({
    mutationFn: personApi.remove,
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: personKeys.detail(id) })
      invalidate()
    },
  })
}

export function useBulkMovePersons() {
  const invalidate = useCreateInvalidation()
  return useMutation({ mutationFn: personApi.bulkMove, onSuccess: invalidate })
}

export function useBulkRemovePersons() {
  const invalidate = useCreateInvalidation()
  return useMutation({ mutationFn: personApi.bulkRemove, onSuccess: invalidate })
}
