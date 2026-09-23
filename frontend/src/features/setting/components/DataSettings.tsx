import { useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useSettingMutation, useSettings } from '../hooks/useSettings.ts'
import { useOpenDataFolder, useOpenLogFolder } from '@/features/app/hooks/useAppInfo.ts'
import styles from './DataSettings.module.css'

export function DataSettings() {
  const settings = useSettings()
  const mutation = useSettingMutation()
  const openDataFolder = useOpenDataFolder()
  const openLogFolder = useOpenLogFolder()
  const [parishName, setParishName] = useState<string | null>(null)
  const [dioceseName, setDioceseName] = useState<string | null>(null)
  const [parishPriestName, setParishPriestName] = useState<string | null>(null)
  const [retentionDays, setRetentionDays] = useState<string | null>(null)
  if (settings.isPending) return <Skeleton />
  if (settings.error) return null
  const name = parishName ?? String(settings.data['general.parishName'] ?? '')
  const diocese = dioceseName ?? String(settings.data['general.dioceseName'] ?? '')
  const parishPriest = parishPriestName ?? String(settings.data['general.parishPriestName'] ?? '')
  const days = retentionDays ?? String(settings.data['data.trashRetentionDays'] ?? 30)
  return (
    <section className={styles.panel} aria-labelledby="data-settings-title">
      <h2 id="data-settings-title">Dữ liệu</h2>
      <div className={styles.section}>
        <h3>Thông tin giáo xứ</h3>
        <div className={styles.identityFields}>
          <Input
            label="Tên giáo xứ"
            value={name}
            disabled={mutation.isPending}
            onChange={(event: any) => setParishName(event.target.value)}
          />
          <Input
            label="Giáo phận"
            value={diocese}
            disabled={mutation.isPending}
            onChange={(event: any) => setDioceseName(event.target.value)}
          />
          <Input
            label="Linh mục chánh xứ"
            value={parishPriest}
            disabled={mutation.isPending}
            onChange={(event: any) => setParishPriestName(event.target.value)}
          />
        </div>
      </div>
      <div className={styles.section}>
        <h3>Quản lý dữ liệu</h3>
        <div className={styles.maintenanceFields}>
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
      </div>
      <div className={styles.actions}>
        <Button
          variant="primary"
          disabled={mutation.isPending}
          onClick={() => {
            mutation.mutate({ key: 'general.parishName', value: name })
            mutation.mutate({ key: 'general.dioceseName', value: diocese })
            mutation.mutate({ key: 'general.parishPriestName', value: parishPriest })
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
        <Button
          variant="secondary"
          disabled={openLogFolder.isPending}
          onClick={() => openLogFolder.mutate()}
        >
          Mở thư mục log
        </Button>
      </div>
    </section>
  )
}
