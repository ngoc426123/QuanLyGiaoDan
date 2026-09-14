import { useMutation } from '@tanstack/react-query'
import { useToastStore } from '@/stores/toast.store.ts'
import { reportApi } from '../api/report.api.ts'

export function useCsvExport() {
  const addToast = useToastStore((state) => state.add)
  return useMutation({
    mutationFn: reportApi.exportCsv,
    onSuccess: (result: any) => {
      if (result.canceled) return
      addToast(`Đã xuất ${result.rowCount} dòng ra tệp CSV.`)
    },
    onError: (error) =>
      addToast(error instanceof Error ? error.message : 'Không thể xuất tệp CSV.', true),
  })
}
