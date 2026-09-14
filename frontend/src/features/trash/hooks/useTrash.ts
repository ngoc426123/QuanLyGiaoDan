import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trashKeys } from '@/shared/queryKeys.ts'
import { trashApi } from '../api/trash.api.ts'
import { useToastStore } from '@/stores/toast.store.ts'

export function useTrash() {
  return useQuery({ queryKey: trashKeys.list(), queryFn: () => trashApi.list() as Promise<any[]> })
}

export function useTrashMutation() {
  const client = useQueryClient()
  const addToast = useToastStore((state) => state.add)
  return useMutation({
    mutationFn: ({ action, input }: any) =>
      action === 'restore'
        ? trashApi.restore(input)
        : action === 'hardRemove'
          ? trashApi.hardRemove(input)
          : trashApi.empty(),
    onSuccess: () => client.invalidateQueries({ queryKey: trashKeys.all }),
    onError: (error: Error) => addToast(error.message, true),
  })
}
