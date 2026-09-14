import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { familyKeys, zoneKeys } from '@/shared/queryKeys.ts'
import { zoneApi } from '../api/zone.api.ts'

export function useZoneEvents() {
  const client = useQueryClient()
  useEffect(() => {
    return zoneApi.onChanged(() => {
      client.invalidateQueries({ queryKey: zoneKeys.all })
      client.invalidateQueries({ queryKey: familyKeys.lists })
    })
  }, [client])
}
