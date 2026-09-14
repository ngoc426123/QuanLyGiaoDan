import { useQuery } from '@tanstack/react-query'
import { dashboardKeys } from '@/shared/queryKeys.ts'
import { dashboardApi } from '../api/dashboard.api.ts'

export function useDashboard() {
  return useQuery({ queryKey: dashboardKeys.summary, queryFn: dashboardApi.getSummary })
}
