import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { dashboardKeys, marriageKeys, personKeys } from '@/shared/queryKeys.ts'

export function useMarriageEvents() {
  const client = useQueryClient()
  useEffect(() => {
    return window.api.events.onMarriageChanged(() => {
      client.invalidateQueries({ queryKey: marriageKeys.all })
      client.invalidateQueries({ queryKey: personKeys.all })
      client.invalidateQueries({ queryKey: dashboardKeys.all })
    })
  }, [client])
}
