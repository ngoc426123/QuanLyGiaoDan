import { useQuery } from '@tanstack/react-query'
import { zoneKeys } from '@/shared/queryKeys.ts'
import { zoneApi } from '../api/zone.api.ts'

export function useZones(filter: Record<string, unknown>) {
  return useQuery({
    queryKey: zoneKeys.list(filter),
    queryFn: () => zoneApi.list(filter) as Promise<any>,
  })
}

export function useZone(id: string | undefined) {
  return useQuery({
    queryKey: zoneKeys.detail(id),
    queryFn: () => zoneApi.getById(id!) as Promise<any>,
    enabled: Boolean(id),
  })
}
