import { useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useSettingMutation, useSettings } from '../hooks/useSettings.ts'
import styles from './ParishSettings.module.css'

export function ParishSettings() {
  const settings = useSettings()
  const mutation = useSettingMutation()
  const [parishName, setParishName] = useState<string | null>(null)
  const [deaneryName, setDeaneryName] = useState<string | null>(null)
  const [dioceseName, setDioceseName] = useState<string | null>(null)
  const [parishPriestName, setParishPriestName] = useState<string | null>(null)
  const [parishAddress, setParishAddress] = useState<string | null>(null)
  const [parishPhone, setParishPhone] = useState<string | null>(null)

  if (settings.isPending) return <Skeleton />
  if (settings.error) return null

  const name = parishName ?? String(settings.data['general.parishName'] ?? '')
  const deanery = deaneryName ?? String(settings.data['general.deaneryName'] ?? '')
  const diocese = dioceseName ?? String(settings.data['general.dioceseName'] ?? '')
  const parishPriest = parishPriestName ?? String(settings.data['general.parishPriestName'] ?? '')
  const address = parishAddress ?? String(settings.data['general.parishAddress'] ?? '')
  const phone = parishPhone ?? String(settings.data['general.parishPhone'] ?? '')

  const save = () => {
    mutation.mutate({ key: 'general.parishName', value: name })
    mutation.mutate({ key: 'general.deaneryName', value: deanery })
    mutation.mutate({ key: 'general.dioceseName', value: diocese })
    mutation.mutate({ key: 'general.parishPriestName', value: parishPriest })
    mutation.mutate({ key: 'general.parishAddress', value: address })
    mutation.mutate({ key: 'general.parishPhone', value: phone })
  }

  return (
    <section className={styles.panel} aria-labelledby="parish-settings-title">
      <div>
        <h2 id="parish-settings-title">Thông tin giáo xứ</h2>
        <p className={styles.description}>
          Thông tin này được dùng trên tiêu đề và các biểu mẫu của giáo xứ.
        </p>
      </div>
      <div className={styles.fields}>
        <Input
          label="Giáo phận"
          value={diocese}
          disabled={mutation.isPending}
          onChange={(event: any) => setDioceseName(event.target.value)}
        />
        <Input
          label="Giáo hạt"
          value={deanery}
          disabled={mutation.isPending}
          onChange={(event: any) => setDeaneryName(event.target.value)}
        />
        <Input
          label="Giáo xứ"
          value={name}
          disabled={mutation.isPending}
          onChange={(event: any) => setParishName(event.target.value)}
        />
        <Input
          label="Linh mục chánh xứ"
          value={parishPriest}
          disabled={mutation.isPending}
          onChange={(event: any) => setParishPriestName(event.target.value)}
        />
        <Input
          label="Địa chỉ giáo xứ"
          value={address}
          disabled={mutation.isPending}
          onChange={(event: any) => setParishAddress(event.target.value)}
        />
        <Input
          label="Số điện thoại giáo xứ"
          type="tel"
          value={phone}
          disabled={mutation.isPending}
          onChange={(event: any) => setParishPhone(event.target.value)}
        />
      </div>
      <div className={styles.actions}>
        <Button variant="primary" disabled={mutation.isPending} onClick={save}>
          Lưu cài đặt dữ liệu
        </Button>
      </div>
    </section>
  )
}
