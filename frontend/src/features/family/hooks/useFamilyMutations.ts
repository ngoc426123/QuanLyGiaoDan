import { useMutation, useQueryClient } from '@tanstack/react-query'
import { familyKeys, personKeys, zoneKeys } from '@/shared/queryKeys.ts'
import { familyApi } from '../api/family.api.ts'

function useInvalidation() {
  const client = useQueryClient()
  return () => {
    client.invalidateQueries({ queryKey: familyKeys.all })
    client.invalidateQueries({ queryKey: personKeys.lists })
    client.invalidateQueries({ queryKey: zoneKeys.lists })
  }
}

export function useCreateFamily() {
  const invalidate = useInvalidation()
  return useMutation({ mutationFn: familyApi.create, onSuccess: invalidate })
}

export function useUpdateFamily() {
  const invalidate = useInvalidation()
  return useMutation({ mutationFn: familyApi.update, onSuccess: invalidate })
}

export function useRemoveFamily() {
  const client = useQueryClient()
  const invalidate = useInvalidation()
  return useMutation({
    mutationFn: familyApi.remove,
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: familyKeys.detail(id) })
      invalidate()
    },
  })
}

export function useBulkMoveFamilies() {
  const invalidate = useInvalidation()
  return useMutation({ mutationFn: familyApi.bulkMove, onSuccess: invalidate })
}

export function useBulkRemoveFamilies() {
  const invalidate = useInvalidation()
  return useMutation({ mutationFn: familyApi.bulkRemove, onSuccess: invalidate })
}
