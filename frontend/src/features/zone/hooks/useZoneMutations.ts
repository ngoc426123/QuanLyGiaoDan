import { useMutation, useQueryClient } from '@tanstack/react-query'
import { familyKeys, zoneKeys } from '@/shared/queryKeys.ts'
import { zoneApi } from '../api/zone.api.ts'

function useInvalidation() {
  const client = useQueryClient()
  return () => {
    client.invalidateQueries({ queryKey: zoneKeys.all })
    client.invalidateQueries({ queryKey: familyKeys.lists })
  }
}

export function useCreateZone() {
  const invalidate = useInvalidation()
  return useMutation({ mutationFn: zoneApi.create, onSuccess: invalidate })
}

export function useUpdateZone() {
  const invalidate = useInvalidation()
  return useMutation({ mutationFn: zoneApi.update, onSuccess: invalidate })
}

export function useRemoveZone() {
  const client = useQueryClient()
  const invalidate = useInvalidation()
  return useMutation({
    mutationFn: zoneApi.remove,
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: zoneKeys.detail(id) })
      invalidate()
    },
  })
}

export function useBulkRemoveZones() {
  const invalidate = useInvalidation()
  return useMutation({ mutationFn: zoneApi.bulkRemove, onSuccess: invalidate })
}
