import { useQuery } from '@tanstack/react-query'
import { familyKeys } from '@/shared/queryKeys.ts'
import { familyApi } from '../api/family.api.ts'

export function useFamilies(filter: Record<string, unknown>) {
  return useQuery({
    queryKey: familyKeys.list(filter),
    queryFn: () => familyApi.list(filter) as Promise<any>,
  })
}

export function useFamily(id: string | undefined) {
  return useQuery({
    queryKey: familyKeys.detail(id),
    queryFn: () => familyApi.getById(id!) as Promise<any>,
    enabled: Boolean(id),
  })
}
