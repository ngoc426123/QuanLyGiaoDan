import { useMutation } from '@tanstack/react-query'
import { useToastStore } from '@/stores/toast.store.ts'
import { backupApi } from '../api/backup.api.ts'

/** Giữ luồng chọn file/đối chiếu ở Main; không nhận đường dẫn từ Renderer.
 * @returns {object} Mutation dùng chung để khoá cả hai nút khi đang chạy
 */
export function useBackup() {
  const addToast = useToastStore((state) => state.add)
  return useMutation({
    mutationFn: ({ action, password }: { action: 'export' | 'import'; password: string }) =>
      action === 'export' ? backupApi.exportToFile(password) : backupApi.importFromFile(password),
    onSuccess: (result: any) => {
      if (result.canceled) return
      addToast(
        result.restarting
          ? 'Đã nhập dữ liệu. Ứng dụng đang khởi động lại…'
          : 'Đã xuất dữ liệu ra file.',
      )
    },
    onError: (error) =>
      addToast(error instanceof Error ? error.message : 'Thao tác thất bại.', true),
  })
}

export function useClearAllData() {
  const addToast = useToastStore((state) => state.add)
  return useMutation({
    mutationFn: backupApi.clearAll,
    onSuccess: () => addToast('Đã xoá dữ liệu nghiệp vụ. Có thể nhập lại tệp CSV.'),
    onError: (error) =>
      addToast(error instanceof Error ? error.message : 'Không thể xoá dữ liệu.', true),
  })
}
