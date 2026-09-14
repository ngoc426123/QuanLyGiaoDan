import { useMutation } from '@tanstack/react-query'
import { useToastStore } from '@/stores/toast.store.js'
import { backupApi } from '../api/backup.api.js'

/** Giữ luồng chọn file/đối chiếu ở Main; không nhận đường dẫn từ Renderer.
 * @returns {object} Mutation dùng chung để khoá cả hai nút khi đang chạy
 */
export function useBackup() {
  const addToast = useToastStore((state) => state.add)
  return useMutation({
    mutationFn: (action) =>
      action === 'export' ? backupApi.exportToFile() : backupApi.importFromFile(),
    onSuccess: (result) => {
      if (result.canceled) return
      addToast(
        result.restarting
          ? 'Đã nhập dữ liệu. Ứng dụng đang khởi động lại…'
          : 'Đã xuất dữ liệu ra file.',
      )
    },
    onError: (error) => addToast(error.message, true),
  })
}
