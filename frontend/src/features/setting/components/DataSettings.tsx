import { useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useSettingMutation, useSettings } from '../hooks/useSettings.ts'
import { useOpenDataFolder } from '@/features/app/hooks/useAppInfo.ts'
import styles from './AppearanceSettings.module.css'

export function DataSettings() {
  const settings = useSettings()
  const mutation = useSettingMutation()
  const openDataFolder = useOpenDataFolder()
  const [parishName, setParishName] = useState<string | null>(null)
  const [retentionDays, setRetentionDays] = useState<string | null>(null)
  if (settings.isPending) return <Skeleton />
  if (settings.error) return null
  const name = parishName ?? String(settings.data['general.parishName'] ?? '')
  const days = retentionDays ?? String(settings.data['data.trashRetentionDays'] ?? 30)
  return (
    <section className={styles.panel} aria-labelledby="data-settings-title">
      <h2 id="data-settings-title">Dữ liệu</h2>
      <p>Thiết lập thông tin giáo xứ và thời hạn giữ bản ghi trong thùng rác.</p>
      <div className={styles.fields}>
        <Input
          label="Tên giáo xứ"
          value={name}
          disabled={mutation.isPending}
          onChange={(event: any) => setParishName(event.target.value)}
        />
        <Input
          label="Số ngày giữ thùng rác"
          type="number"
          min="1"
          max="365"
          value={days}
          disabled={mutation.isPending}
          onChange={(event: any) => setRetentionDays(event.target.value)}
        />
      </div>
      <Button
        disabled={mutation.isPending}
        onClick={() => {
          mutation.mutate({ key: 'general.parishName', value: name })
          mutation.mutate({ key: 'data.trashRetentionDays', value: Number(days) })
        }}
      >
        Lưu cài đặt dữ liệu
      </Button>
      <Button
        variant="secondary"
        disabled={openDataFolder.isPending}
        onClick={() => openDataFolder.mutate()}
      >
        Mở thư mục dữ liệu
      </Button>
    </section>
  )
}
