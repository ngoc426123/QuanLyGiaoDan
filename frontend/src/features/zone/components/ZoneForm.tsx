import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { Input } from '@/components/ui/Input.tsx'
import styles from './Zone.module.css'

type ZoneInput = { name: string; holyName: string; note: string }

function toFormValue(initialValue: any): ZoneInput {
  return {
    name: initialValue?.name ?? '',
    holyName: initialValue?.holyName ?? '',
    note: initialValue?.note ?? '',
  }
}

export function ZoneForm({ initialValue, onSubmit, isPending, submitLabel }: any) {
  const [value, setValue] = useState<ZoneInput>(() => toFormValue(initialValue))
  const [error, setError] = useState<any>(null)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    try {
      await onSubmit(value)
    } catch (nextError) {
      setError(nextError)
    }
  }
  const fieldErrors = error?.details?.fieldErrors ?? {}
  return (
    <form className={styles.form} onSubmit={submit}>
      <Input
        label="Tên giáo họ"
        value={value.name}
        error={fieldErrors.name}
        onChange={(event: any) => setValue({ ...value, name: event.target.value })}
        required
        maxLength={100}
      />
      <Input
        label="Bổn mạng"
        value={value.holyName}
        error={fieldErrors.holyName}
        onChange={(event: any) => setValue({ ...value, holyName: event.target.value })}
        maxLength={75}
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
      <Button type="submit" variant="primary" isPending={isPending} disabled={isPending}>
        {submitLabel}
      </Button>
    </form>
  )
}
