import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { familyKeys, personKeys, zoneKeys } from '@/shared/queryKeys.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { importApi } from '../api/import.api.ts'

export function useCsvImport() {
  const addToast = useToastStore((state) => state.add)
  const client = useQueryClient()
  const [progress, setProgress] = useState<any>(null)
  const pendingProgress = useRef<any>(null)
  useEffect(() => {
    const subscribe = window.api.events.onImportProgress
    if (typeof subscribe !== 'function') return undefined
    let timer: number | undefined
    const stop = subscribe((payload: any) => {
      pendingProgress.current = payload
      if (timer) return
      timer = window.setTimeout(() => {
        setProgress(pendingProgress.current)
        timer = undefined
      }, 100)
    })
    return () => {
      stop()
      if (timer) window.clearTimeout(timer)
    }
  }, [])
  const choose = useMutation({
    mutationFn: importApi.chooseCsv,
    onError: (error) =>
      addToast(error instanceof Error ? error.message : 'Không thể đọc tệp CSV.', true),
  })
  const commit = useMutation({
    mutationFn: importApi.commitCsv,
    onMutate: () => setProgress({ processed: 0, total: 0, percent: 0 }),
    onSuccess: (result: any) => {
      client.invalidateQueries({ queryKey: personKeys.all })
      client.invalidateQueries({ queryKey: familyKeys.all })
      client.invalidateQueries({ queryKey: zoneKeys.all })
      addToast(`Đã nhập ${result.rowCount} dòng CSV.`)
    },
    onSettled: () => setProgress(null),
    onError: (error) =>
      addToast(error instanceof Error ? error.message : 'Không thể nhập CSV.', true),
  })
  return { choose, commit, progress }
}
