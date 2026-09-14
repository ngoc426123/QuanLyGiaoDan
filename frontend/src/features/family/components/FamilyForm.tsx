import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Select } from '@/components/ui/Select.tsx'
import styles from './Family.module.css'

type FamilyInput = { zoneId: string; name: string; address: string; note: string }

function toFormValue(initialValue: any): FamilyInput {
  return {
    zoneId: initialValue?.zoneId ?? '',
    name: initialValue?.name ?? '',
    address: initialValue?.address ?? '',
    note: initialValue?.note ?? '',
  }
}

export function FamilyForm({ initialValue, zones, onSubmit, isPending, submitLabel }: any) {
  const [value, setValue] = useState<FamilyInput>(() => toFormValue(initialValue))
  const [error, setError] = useState<any>(null)
  const fieldErrors = error?.details?.fieldErrors ?? {}
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    try {
      await onSubmit(value)
    } catch (nextError) {
      setError(nextError)
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Select
        label="Giáo họ"
        value={value.zoneId}
        error={fieldErrors.zoneId}
        onChange={(event: any) => setValue({ ...value, zoneId: event.target.value })}
        required
      >
        <option value="">Chọn giáo họ</option>
        {zones.map((zone: any) => (
          <option key={zone.id} value={zone.id}>
            {zone.name}
          </option>
        ))}
      </Select>
      <Input
        label="Tên hộ"
        value={value.name}
        error={fieldErrors.name}
        onChange={(event: any) => setValue({ ...value, name: event.target.value })}
        required
        maxLength={120}
      />
      <Input
        label="Địa chỉ"
        value={value.address}
        error={fieldErrors.address}
        onChange={(event: any) => setValue({ ...value, address: event.target.value })}
        maxLength={255}
      />
      <label className={styles.textareaField}>
        <span>Ghi chú</span>
        <textarea
          className={styles.textarea}
          value={value.note}
          onChange={(event) => setValue({ ...value, note: event.target.value })}
          maxLength={2000}
        />
      </label>
      {error && !Object.keys(fieldErrors).length && (
        <p role="alert" className={styles.error}>
          {error.message}
        </p>
      )}
      <Button type="submit" isPending={isPending} disabled={isPending}>
        {submitLabel}
      </Button>
    </form>
  )
}
