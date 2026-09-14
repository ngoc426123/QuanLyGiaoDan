import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { dashboardKeys, familyKeys, personKeys, zoneKeys } from '@/shared/queryKeys.ts'
import { personApi } from '../api/person.api.ts'

export function usePersonEvents() {
  const client = useQueryClient()
  useEffect(() => {
    return personApi.onChanged(async () => {
      client.invalidateQueries({ queryKey: personKeys.all })
      client.invalidateQueries({ queryKey: familyKeys.all })
      client.invalidateQueries({ queryKey: zoneKeys.lists })
      client.invalidateQueries({ queryKey: dashboardKeys.all })
      await client.refetchQueries({ queryKey: personKeys.lists, type: 'active' })
    })
  }, [client])
}
