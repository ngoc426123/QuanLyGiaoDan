import { useMutation } from '@tanstack/react-query'
import { useToastStore } from '@/stores/toast.store.ts'
import { reportApi } from '../api/report.api.ts'

export function useReportExport(format: 'csv' | 'xlsx' | 'pdf') {
  const addToast = useToastStore((state) => state.add)
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      input.report === 'personProfile'
        ? reportApi.exportPersonProfilePdf({
            personId: (input.filter as { personId: string }).personId,
          })
        : format === 'csv'
          ? reportApi.exportCsv(input)
          : format === 'xlsx'
            ? reportApi.exportXlsx(input)
            : reportApi.exportPdf(input),
    onSuccess: (result: any) => {
      if (result.canceled) return
      addToast(`Đã xuất ${result.rowCount} dòng ra tệp ${format.toUpperCase()}.`)
    },
    onError: (error) =>
      addToast(error instanceof Error ? error.message : 'Không thể xuất tệp.', true),
  })
}

export const useCsvExport = () => useReportExport('csv')
