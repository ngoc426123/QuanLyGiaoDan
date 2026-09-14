import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { familyKeys, personKeys, zoneKeys } from '@/shared/queryKeys.ts'
import { personApi } from '../api/person.api.ts'

export function usePersonEvents() {
  const client = useQueryClient()
  useEffect(() => {
    return personApi.onChanged(() => {
      client.invalidateQueries({ queryKey: personKeys.all })
      client.invalidateQueries({ queryKey: familyKeys.lists })
      client.invalidateQueries({ queryKey: zoneKeys.lists })
    })
  }, [client])
}
