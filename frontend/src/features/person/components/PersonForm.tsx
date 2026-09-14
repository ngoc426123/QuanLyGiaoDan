import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { DateInput } from '@/components/ui/DateInput.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Select } from '@/components/ui/Select.tsx'
import styles from './Person.module.css'

const emptyValue = {
  fullName: '',
  givenName: '',
  holyName: '',
  gender: '',
  birthDate: '',
  phone: '',
  baptismDate: '',
  firstCommunionDate: '',
  confirmationDate: '',
  marriageDate: '',
  deathDate: '',
  note: '',
  familyId: '',
  relationship: 'other',
  fromDate: '',
}

const editableFields = [
  'fullName',
  'givenName',
  'holyName',
  'gender',
  'birthDate',
  'phone',
  'baptismDate',
  'firstCommunionDate',
  'confirmationDate',
  'marriageDate',
  'deathDate',
  'note',
] as const

function toFormValue(initialValue: any) {
  const value = { ...emptyValue }
  for (const key of Object.keys(emptyValue)) {
    if (Object.hasOwn(initialValue ?? {}, key)) value[key] = initialValue[key] ?? ''
  }
  return value
}

function toPayload(value: any) {
  const payload: any = {}
  for (const key of editableFields) {
    payload[key] = key === 'fullName' ? value[key] : value[key] || null
  }
  if (value.familyId) {
    payload.family = {
      familyId: value.familyId,
      relationship: value.relationship,
      fromDate: value.fromDate,
    }
  }
  return payload
}

export function PersonForm({
  initialValue,
  families,
  onSubmit,
  isPending,
  submitLabel,
  allowFamilyAssignment = false,
}: any) {
  const [value, setValue] = useState(() => toFormValue(initialValue))
  const [error, setError] = useState<any>(null)
  const fieldErrors = error?.details?.fieldErrors ?? {}
  const set = (key: string, next: string) => setValue({ ...value, [key]: next })
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    try {
      await onSubmit(toPayload(value))
    } catch (nextError) {
      setError(nextError)
    }
  }
  return (
    <form className={styles.form} onSubmit={submit}>
      <fieldset className={styles.group}>
        <h2>Thông tin cơ bản</h2>
        <Input
          label="Họ và tên"
          value={value.fullName}
          error={fieldErrors.fullName}
          onChange={(event: any) => set('fullName', event.target.value)}
          required
          maxLength={120}
        />
        <Input
          label="Tên gọi"
          value={value.givenName}
          error={fieldErrors.givenName}
          onChange={(event: any) => set('givenName', event.target.value)}
          maxLength={50}
        />
        <Input
          label="Tên thánh"
          value={value.holyName}
          error={fieldErrors.holyName}
          onChange={(event: any) => set('holyName', event.target.value)}
          maxLength={75}
        />
        <Select
          label="Giới tính"
          value={value.gender}
          error={fieldErrors.gender}
          onChange={(event: any) => set('gender', event.target.value)}
        >
          <option value="">Chưa cập nhật</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </Select>
        <DateInput
          label="Ngày sinh"
          value={value.birthDate}
          error={fieldErrors.birthDate}
          onChange={(next: string) => set('birthDate', next)}
        />
        <Input
          label="Số điện thoại"
          value={value.phone}
          error={fieldErrors.phone}
          onChange={(event: any) => set('phone', event.target.value)}
          maxLength={20}
        />
      </fieldset>
      <fieldset className={styles.group}>
        <h2>Bí tích</h2>
        <DateInput
          label="Ngày rửa tội"
          value={value.baptismDate}
          error={fieldErrors.baptismDate}
          onChange={(next: string) => set('baptismDate', next)}
        />
        <DateInput
          label="Ngày rước lễ lần đầu"
          value={value.firstCommunionDate}
          error={fieldErrors.firstCommunionDate}
          onChange={(next: string) => set('firstCommunionDate', next)}
        />
        <DateInput
          label="Ngày thêm sức"
          value={value.confirmationDate}
          error={fieldErrors.confirmationDate}
          onChange={(next: string) => set('confirmationDate', next)}
        />
        <DateInput
          label="Ngày hôn phối"
          value={value.marriageDate}
          error={fieldErrors.marriageDate}
          onChange={(next: string) => set('marriageDate', next)}
        />
      </fieldset>
      <fieldset className={styles.group}>
        <h2>Tình trạng</h2>
        <DateInput
          label="Ngày qua đời"
          value={value.deathDate}
          error={fieldErrors.deathDate}
          onChange={(next: string) => set('deathDate', next)}
        />
        {allowFamilyAssignment && (
          <Select
            label="Gán vào hộ"
            value={value.familyId}
            error={fieldErrors.familyId}
            onChange={(event: any) => set('familyId', event.target.value)}
          >
            <option value="">Chưa gán hộ</option>
            {families.map((family: any) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </Select>
        )}
        {allowFamilyAssignment && value.familyId && (
          <>
            <Select
              label="Quan hệ trong hộ"
              value={value.relationship}
              error={fieldErrors.relationship}
              onChange={(event: any) => set('relationship', event.target.value)}
            >
              <option value="head">Chủ hộ</option>
              <option value="spouse">Vợ/chồng</option>
              <option value="child">Con</option>
              <option value="parent">Cha/mẹ</option>
              <option value="other">Khác</option>
            </Select>
            <DateInput
              label="Ngày vào hộ"
              value={value.fromDate}
              error={fieldErrors.fromDate}
              onChange={(next: string) => set('fromDate', next)}
              required
            />
          </>
        )}
        <label className={styles.textareaField}>
          <span>Ghi chú</span>
          <textarea
            className={styles.textarea}
            value={value.note}
            onChange={(event) => set('note', event.target.value)}
            maxLength={2000}
          />
        </label>
      </fieldset>
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
