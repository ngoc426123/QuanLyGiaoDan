import { useMutation, useQuery } from '@tanstack/react-query'
import { appKeys } from '@/shared/queryKeys.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { appApi } from '../api/app.api.ts'

export function useAppVersion() {
  return useQuery({ queryKey: appKeys.version, queryFn: appApi.getVersion, staleTime: Infinity })
}

export function useOpenDataFolder() {
  const addToast = useToastStore((state) => state.add)
  return useMutation({
    mutationFn: appApi.openDataFolder,
    onError: (error) =>
      addToast(error instanceof Error ? error.message : 'Không mở được thư mục.', true),
  })
}

export function useOpenLogFolder() {
  const addToast = useToastStore((state) => state.add)
  return useMutation({
    mutationFn: appApi.openLogFolder,
    onError: (error) =>
      addToast(error instanceof Error ? error.message : 'Không mở được thư mục log.', true),
  })
}
