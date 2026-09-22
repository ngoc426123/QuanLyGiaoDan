import { useQuery } from '@tanstack/react-query'
import { personKeys } from '@/shared/queryKeys.ts'
import { personApi } from '../api/person.api.ts'

export function usePersons(filter: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: personKeys.list(filter),
    queryFn: () => personApi.list(filter) as Promise<any>,
    enabled,
  })
}

export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: personKeys.detail(id),
    queryFn: () => personApi.getById(id!) as Promise<any>,
    enabled: Boolean(id),
  })
}
