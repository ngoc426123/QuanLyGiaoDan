import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { DateInput } from '@/components/ui/DateInput.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { SearchableSelect } from '@/components/ui/SearchableSelect.tsx'
import { Select } from '@/components/ui/Select.tsx'
import styles from './Person.module.css'

const emptyValue = {
  fullName: '',
  givenName: '',
  holyName: '',
  gender: '',
  birthDate: '',
  phone: '',
  email: '',
  occupation: '',
  secondaryPhone: '',
  residenceStatus: '',
  pastoralStatus: '',
  pastoralNote: '',
  source: 'manual',
  baptismDate: '',
  baptismMinister: '',
  baptismPlace: '',
  firstCommunionDate: '',
  firstCommunionMinister: '',
  firstCommunionPlace: '',
  confirmationDate: '',
  confirmationMinister: '',
  confirmationPlace: '',
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
  'email',
  'occupation',
  'secondaryPhone',
  'residenceStatus',
  'pastoralStatus',
  'pastoralNote',
  'source',
  'deathDate',
  'note',
] as const

function toFormValue(initialValue: any) {
  const value = { ...emptyValue }
  for (const key of Object.keys(emptyValue)) {
    if (Object.hasOwn(initialValue ?? {}, key)) value[key] = initialValue[key] ?? ''
  }
  for (const sacrament of initialValue?.sacraments ?? []) {
    const key = sacrament.type === 'first_communion' ? 'firstCommunion' : sacrament.type
    const dateKey = `${key}Date`
    const ministerKey = `${key}Minister`
    const placeKey = `${key}Place`
    if (Object.hasOwn(value, dateKey)) (value as any)[dateKey] = sacrament.date ?? ''
    if (Object.hasOwn(value, ministerKey)) (value as any)[ministerKey] = sacrament.minister ?? ''
    if (Object.hasOwn(value, placeKey)) (value as any)[placeKey] = sacrament.place ?? ''
  }
  return value
}

function toPayload(value: any, allowFamilyAssignment: boolean) {
  const payload: any = {}
  for (const key of editableFields) {
    payload[key] = key === 'fullName' ? value[key] : value[key] || null
  }
  payload.sacraments = [
    ['baptism', value.baptismDate, value.baptismMinister, value.baptismPlace],
    [
      'first_communion',
      value.firstCommunionDate,
      value.firstCommunionMinister,
      value.firstCommunionPlace,
    ],
    ['confirmation', value.confirmationDate, value.confirmationMinister, value.confirmationPlace],
  ]
    .filter(([, date]) => Boolean(date))
    .map(([type, date, minister, place]) => ({
      type,
      date,
      minister: minister || null,
      place: place || null,
    }))
  if (allowFamilyAssignment && value.familyId) {
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
      await onSubmit(toPayload(value, allowFamilyAssignment))
    } catch (nextError) {
      setError(nextError)
    }
  }
  return (
    <form className={styles.form} onSubmit={submit}>
      <fieldset className={styles.group}>
        <h2>Thông tin định danh &amp; Hành chính</h2>
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
        <Input
          label="Email"
          value={value.email}
          error={fieldErrors.email}
          onChange={(event: any) => set('email', event.target.value)}
          maxLength={254}
        />
        <Input
          label="Nghề nghiệp"
          value={value.occupation}
          error={fieldErrors.occupation}
          onChange={(event: any) => set('occupation', event.target.value)}
          maxLength={120}
        />
        <Input
          label="Số liên hệ thay thế"
          value={value.secondaryPhone}
          error={fieldErrors.secondaryPhone}
          onChange={(event: any) => set('secondaryPhone', event.target.value)}
          maxLength={20}
        />
      </fieldset>
      <fieldset className={styles.group}>
        <h2>Đời sống Bí tích</h2>
        <div className={styles.sacramentGrid}>
          <div className={styles.sacramentColumn}>
            <h3>Rửa tội</h3>
            <DateInput
              label="Ngày cử hành"
              value={value.baptismDate}
              error={fieldErrors.baptismDate}
              onChange={(next: string) => set('baptismDate', next)}
            />
            <Input
              label="Linh mục cử hành"
              value={value.baptismMinister}
              onChange={(event: any) => set('baptismMinister', event.target.value)}
              maxLength={120}
            />
            <Input
              label="Nơi cử hành"
              value={value.baptismPlace}
              onChange={(event: any) => set('baptismPlace', event.target.value)}
              maxLength={255}
            />
          </div>
          <div className={styles.sacramentColumn}>
            <h3>Rước lễ lần đầu</h3>
            <DateInput
              label="Ngày cử hành"
              value={value.firstCommunionDate}
              error={fieldErrors.firstCommunionDate}
              onChange={(next: string) => set('firstCommunionDate', next)}
            />
            <Input
              label="Linh mục cử hành"
              value={value.firstCommunionMinister}
              onChange={(event: any) => set('firstCommunionMinister', event.target.value)}
              maxLength={120}
            />
            <Input
              label="Nơi cử hành"
              value={value.firstCommunionPlace}
              onChange={(event: any) => set('firstCommunionPlace', event.target.value)}
              maxLength={255}
            />
          </div>
          <div className={styles.sacramentColumn}>
            <h3>Thêm sức</h3>
            <DateInput
              label="Ngày cử hành"
              value={value.confirmationDate}
              error={fieldErrors.confirmationDate}
              onChange={(next: string) => set('confirmationDate', next)}
            />
            <Input
              label="Linh mục cử hành"
              value={value.confirmationMinister}
              onChange={(event: any) => set('confirmationMinister', event.target.value)}
              maxLength={120}
            />
            <Input
              label="Nơi cử hành"
              value={value.confirmationPlace}
              onChange={(event: any) => set('confirmationPlace', event.target.value)}
              maxLength={255}
            />
          </div>
        </div>
      </fieldset>
      <fieldset className={styles.group}>
        <h2>Tình trạng</h2>
        <DateInput
          label="Ngày qua đời"
          value={value.deathDate}
          error={fieldErrors.deathDate}
          onChange={(next: string) => set('deathDate', next)}
        />
        <Select
          label="Tình trạng cư trú"
          value={value.residenceStatus}
          error={fieldErrors.residenceStatus}
          onChange={(event: any) => set('residenceStatus', event.target.value)}
        >
          <option value="">Chưa cập nhật</option>
          <option value="permanent">Thường trú</option>
          <option value="temporary">Tạm trú</option>
          <option value="moved_away">Đã chuyển đi</option>
        </Select>
        <Select
          label="Tình trạng mục vụ"
          value={value.pastoralStatus}
          error={fieldErrors.pastoralStatus}
          onChange={(event: any) => set('pastoralStatus', event.target.value)}
        >
          <option value="">Chưa cập nhật</option>
          <option value="ordinary">Bình thường</option>
          <option value="catechism">Đang học giáo lý</option>
          <option value="catechist">Giáo lý viên</option>
          <option value="needs_visit">Cần thăm viếng</option>
        </Select>
        <Select
          label="Nguồn tạo hồ sơ"
          value={value.source}
          error={fieldErrors.source}
          onChange={(event: any) => set('source', event.target.value)}
        >
          <option value="manual">Nhập thủ công</option>
          <option value="csv_import">Nhập CSV</option>
          <option value="transferred">Chuyển đến</option>
          <option value="restored">Khôi phục dữ liệu</option>
        </Select>
        {allowFamilyAssignment && (
          <SearchableSelect
            label="Gán vào hộ"
            value={value.familyId}
            options={families}
            error={fieldErrors.familyId}
            emptyOptionLabel="Chưa gán hộ"
            placeholder="Tìm hộ theo tên..."
            getOptionLabel={(family: any) => family.name}
            getOptionValue={(family: any) => family.id}
            onChange={(nextId: string) => set('familyId', nextId)}
          />
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
          <span>Ghi chú mục vụ</span>
          <textarea
            className={styles.textarea}
            value={value.pastoralNote}
            onChange={(event) => set('pastoralNote', event.target.value)}
            maxLength={2000}
          />
        </label>
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
      <Button type="submit" variant="primary" isPending={isPending} disabled={isPending}>
        {submitLabel}
      </Button>
    </form>
  )
}
