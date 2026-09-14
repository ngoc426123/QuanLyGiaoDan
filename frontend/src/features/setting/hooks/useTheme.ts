import { useEffect } from 'react'
import { useUIStore } from '@/stores/ui.store.ts'
import { useSettings } from './useSettings.ts'

function cachedTheme() {
  try {
    return localStorage.getItem('elecrusion.theme') || 'system'
  } catch {
    return 'system'
  }
}

/** Đồng bộ DOM và cache khởi động; không sao chép settings vào Zustand.
 * @returns {void}
 */
export function useTheme() {
  const { data } = useSettings()
  const previewTheme = useUIStore((state) => state.theme)
  const previewDensity = useUIStore((state) => state.density)
  const theme = previewTheme || data?.['ui.theme'] || cachedTheme()
  const density = previewDensity || data?.['ui.density'] || 'comfortable'
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === 'dark' || (theme === 'system' && media.matches) ? 'dark' : 'light'
    }
    apply()
    media.addEventListener('change', apply)
    // Chỉ cache giá trị đã xác nhận từ DB, không cache bản xem trước có thể thất bại.
    if (data?.['ui.theme']) {
      try {
        localStorage.setItem('elecrusion.theme', data['ui.theme'])
      } catch {
        /* Không ảnh hưởng lưu DB. */
      }
    }
    return () => media.removeEventListener('change', apply)
  }, [theme, data])
  useEffect(() => {
    document.documentElement.dataset.density = density
  }, [density])
}
