import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../api/search.api.ts'
import { searchKeys } from '@/shared/queryKeys.ts'

export function useDirectorySearch(query: string) {
  return useQuery({
    queryKey: searchKeys.query(query),
    queryFn: () => searchApi.query(query) as Promise<any[]>,
    enabled: query.trim().length > 0,
  })
}
