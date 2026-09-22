import { useQuery } from '@tanstack/react-query'
import { dashboardKeys } from '@/shared/queryKeys.ts'
import { dashboardApi } from '../api/dashboard.api.ts'

function currentMonth() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

export function useDashboard(month = currentMonth()) {
  return useQuery({
    queryKey: dashboardKeys.summary(month),
    queryFn: () => dashboardApi.getSummary({ month }),
  })
}
