import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingKeys } from '@/shared/queryKeys.js'
import { useToastStore } from '@/stores/toast.store.js'
import { useUIStore } from '@/stores/ui.store.js'
import { settingApi } from '../api/setting.api.js'

/** Đọc cấu hình thật; dữ liệu chỉ nằm trong Query cache.
 * @returns {object} Kết quả truy vấn TanStack Query
 */
export function useSettings() {
  return useQuery({ queryKey: settingKeys.all, queryFn: settingApi.getAll })
}

/** Lưu cấu hình và làm mới đúng nhóm key.
 * @returns {object} Mutation với isPending để khoá thao tác
 */
export function useSettingMutation() {
  const client = useQueryClient()
  const addToast = useToastStore((state) => state.add)
  const setPreview = useUIStore((state) => state.setPreview)
  return useMutation({
    mutationFn: settingApi.set,
    onSuccess: () => client.invalidateQueries({ queryKey: settingKeys.all }),
    onError: (error) => addToast(error.message, true),
    onSettled: (_data, _error, input) =>
      setPreview(input.key === 'ui.theme' ? 'theme' : 'density', null),
  })
}

/** Đăng ký một lần ở App Shell; broadcast chỉ invalidate.
 * @returns {void}
 */
export function useSettingEvents() {
  const client = useQueryClient()
  useEffect(
    () =>
      settingApi.onChanged(() => {
        client.invalidateQueries({ queryKey: settingKeys.all })
      }),
    [client],
  )
}
