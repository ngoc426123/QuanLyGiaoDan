import { useEffect } from 'react'
import { useToastStore } from '@/stores/toast.store.ts'

/** Hiển thị lỗi nền do Main phát, không dùng dữ liệu chi tiết từ lỗi. */
export function useAppErrors() {
  const addToast = useToastStore((state) => state.add)
  useEffect(
    () =>
      window.api.events.onAppError((payload: { message?: string }) => {
        addToast(payload?.message || 'Một tác vụ nền gặp lỗi.', true)
      }),
    [addToast],
  )
}
