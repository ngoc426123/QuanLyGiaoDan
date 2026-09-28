import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { suggestionKeys } from '@/shared/queryKeys.ts'
import { suggestionApi } from '../api/suggestion.api.ts'

export function useSuggestions(category: string, search = '') {
  return useQuery({
    queryKey: suggestionKeys.list(category, { search }),
    queryFn: () => suggestionApi.list(category, search ? { search } : {}),
    enabled: Boolean(window.api?.suggestion?.list),
  })
}

export function useSuggestionValues(category: string, fallback: readonly string[], enabled = true) {
  const [values, setValues] = useState<string[]>([...fallback])
  const fallbackKey = fallback.join('\u0000')
  useEffect(() => {
    if (!enabled || !window.api?.suggestion?.list) return undefined
    let active = true
    window.api.suggestion.list({ category, page: 1, pageSize: 200 }).then((envelope: any) => {
      if (!active || !envelope?.ok) return
      const next = (envelope.data ?? []).map((item: any) => item.value).filter(Boolean)
      if (next.length) setValues(next)
    })
    const unsubscribe = window.api.events?.onSuggestionChanged?.(() => {
      window.api.suggestion.list({ category, page: 1, pageSize: 200 }).then((envelope: any) => {
        if (!active || !envelope?.ok) return
        const next = (envelope.data ?? []).map((item: any) => item.value).filter(Boolean)
        setValues(next.length ? next : fallbackKey ? fallbackKey.split('\u0000') : [])
      })
    })
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [category, enabled, fallbackKey])
  return values
}

export function useSuggestionMutations() {
  const client = useQueryClient()
  return {
    create: useMutation({
      mutationFn: suggestionApi.create,
      onSuccess: () => client.invalidateQueries({ queryKey: suggestionKeys.all }),
    }),
    update: useMutation({
      mutationFn: suggestionApi.update,
      onSuccess: () => client.invalidateQueries({ queryKey: suggestionKeys.all }),
    }),
    remove: useMutation({
      mutationFn: suggestionApi.remove,
      onSuccess: () => client.invalidateQueries({ queryKey: suggestionKeys.all }),
    }),
  }
}

export function useSuggestionEvents() {
  const client = useQueryClient()
  useEffect(() => {
    if (!window.api?.events?.onSuggestionChanged) return undefined
    return suggestionApi.onChanged(() => client.invalidateQueries({ queryKey: suggestionKeys.all }))
  }, [client])
}
