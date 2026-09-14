import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { familyKeys, personKeys, zoneKeys } from '@/shared/queryKeys.ts'
import { familyApi } from '../api/family.api.ts'

export function useFamilyEvents() {
  const client = useQueryClient()
  useEffect(() => {
    return familyApi.onChanged(() => {
      client.invalidateQueries({ queryKey: familyKeys.all })
      client.invalidateQueries({ queryKey: personKeys.lists })
      client.invalidateQueries({ queryKey: zoneKeys.lists })
    })
  }, [client])
}
