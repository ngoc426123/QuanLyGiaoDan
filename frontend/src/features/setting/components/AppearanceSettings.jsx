import { Select } from '@/components/ui/Select.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { Skeleton } from '@/components/ui/Skeleton.jsx'
import { useUIStore } from '@/stores/ui.store.js'
import { useSettings, useSettingMutation } from '../hooks/useSettings.js'
import styles from './AppearanceSettings.module.css'

export function AppearanceSettings() {
  const settings = useSettings()
  const mutation = useSettingMutation()
  const setPreview = useUIStore((state) => state.setPreview)
  const previewTheme = useUIStore((state) => state.theme)
  const previewDensity = useUIStore((state) => state.density)
  function change(key, value) {
    if (mutation.isPending) return
    const field = key === 'ui.theme' ? 'theme' : 'density'
    setPreview(field, value)
    mutation.mutate({ key, value })
  }
  if (settings.isPending) return <Skeleton />
  if (settings.error) return <ErrorState error={settings.error} onRetry={settings.refetch} />
  return (
    <section className={styles.panel} aria-labelledby="appearance-title">
      <h2 id="appearance-title">Giao diện</h2>
      <p>Chọn không gian làm việc phù hợp với bạn.</p>
      <div className={styles.fields}>
        <Select
          label="Chế độ giao diện"
          value={previewTheme || settings.data['ui.theme']}
          disabled={mutation.isPending}
          onChange={(event) => change('ui.theme', event.target.value)}
        >
          <option value="light">Sáng</option>
          <option value="dark">Tối</option>
          <option value="system">Theo hệ thống</option>
        </Select>
        <Select
          label="Mật độ hiển thị"
          value={previewDensity || settings.data['ui.density']}
          disabled={mutation.isPending}
          onChange={(event) => change('ui.density', event.target.value)}
        >
          <option value="comfortable">Thoải mái</option>
          <option value="compact">Gọn</option>
        </Select>
      </div>
      <p>Ngôn ngữ: Tiếng Việt</p>
    </section>
  )
}
