import { useQuery } from '@tanstack/react-query'
import { activityLogApi } from '../api/activityLog.api.ts'

export function useActivityLog(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ['activity-log', entityType, entityId],
    queryFn: () => activityLogApi.list({ entityType, entityId: entityId! }) as Promise<any[]>,
    enabled: Boolean(entityId),
  })
}
