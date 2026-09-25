import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { DateInput } from '@/components/ui/DateInput.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { SearchableSelect } from '@/components/ui/SearchableSelect.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { useCreatePerson } from '../hooks/usePersonMutations.ts'
import { personName } from '../personName.ts'
import styles from './Person.module.css'

const emptyValue = {
  fullName: '',
  personType: 'parish',
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
  parishName: '',
  dioceseName: '',
  familyId: '',
  relationship: 'other',
  fromDate: '',
  fatherId: '',
  motherId: '',
  fatherMode: 'internal',
  motherMode: 'internal',
  fatherExternalName: '',
  motherExternalName: '',
}

const editableFields = [
  'fullName',
  'personType',
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
  'parishName',
  'dioceseName',
] as const

const externalEditableFields = new Set([
  'fullName',
  'personType',
  'holyName',
  'birthDate',
  'phone',
  'note',
  'parishName',
  'dioceseName',
])

function toFormValue(initialValue: any) {
  const value = { ...emptyValue }
  for (const key of Object.keys(emptyValue)) {
    if (Object.hasOwn(initialValue ?? {}, key)) value[key] = initialValue[key] ?? ''
  }
  value.personType = initialValue?.personType ?? value.personType
  for (const sacrament of initialValue?.sacraments ?? []) {
    const key = sacrament.type === 'first_communion' ? 'firstCommunion' : sacrament.type
    const dateKey = `${key}Date`
    const ministerKey = `${key}Minister`
    const placeKey = `${key}Place`
    if (Object.hasOwn(value, dateKey)) (value as any)[dateKey] = sacrament.date ?? ''
    if (Object.hasOwn(value, ministerKey)) (value as any)[ministerKey] = sacrament.minister ?? ''
    if (Object.hasOwn(value, placeKey)) (value as any)[placeKey] = sacrament.place ?? ''
  }
  value.fatherId = initialValue?.parents?.fatherId ?? ''
  value.motherId = initialValue?.parents?.motherId ?? ''
  value.fatherMode =
    initialValue?.parents?.father?.personType === 'external' ? 'external' : 'internal'
  value.motherMode =
    initialValue?.parents?.mother?.personType === 'external' ? 'external' : 'internal'
  return value
}

function toPayload(value: any, allowFamilyAssignment: boolean, quickAdded: Record<string, any>) {
  const payload: any = {}
  for (const key of editableFields) {
    if (value.personType === 'external' && !externalEditableFields.has(key)) continue
    payload[key] = key === 'fullName' ? value[key] : value[key] || null
  }
  payload.sacraments = [
    ['baptism', value.baptismDate, value.baptismMinister, value.baptismPlace],
    ...(value.personType === 'parish'
      ? [
          [
            'first_communion',
            value.firstCommunionDate,
            value.firstCommunionMinister,
            value.firstCommunionPlace,
          ],
        ]
      : []),
    ['confirmation', value.confirmationDate, value.confirmationMinister, value.confirmationPlace],
  ]
    .filter(([, date]) => Boolean(date))
    .map(([type, date, minister, place]) => ({
      type,
      date,
      minister: minister || null,
      place: place || null,
    }))
  payload.parents = {
    fatherId: value.fatherId || quickAdded.father?.id || null,
    motherId: value.motherId || quickAdded.mother?.id || null,
    fatherExternalName: value.fatherMode === 'external' ? value.fatherExternalName || null : null,
    motherExternalName: value.motherMode === 'external' ? value.motherExternalName || null : null,
  }
  if (allowFamilyAssignment && value.familyId) {
    payload.family = {
      familyId: value.familyId,
      relationship: value.relationship,
      fromDate: value.fromDate,
    }
  }
  return payload
}

const parentRoles = [
  { key: 'father', title: 'Cha', idField: 'fatherId', modeField: 'fatherMode' },
  { key: 'mother', title: 'Mẹ', idField: 'motherId', modeField: 'motherMode' },
]

function QuickExternalPersonModal({ onClose, onCreated }: any) {
  const create = useCreatePerson()
  const [value, setValue] = useState({
    holyName: '',
    fullName: '',
    birthDate: '',
    phone: '',
    parishName: '',
    dioceseName: '',
    note: '',
  })
  const [error, setError] = useState<any>(null)
  const set = (field: string, next: string) =>
    setValue((current) => ({ ...current, [field]: next }))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Modal được render qua portal, nhưng submit vẫn bubble theo cây React đến form giáo dân.
    event.stopPropagation()
    setError(null)
    try {
      const result: any = await create.mutateAsync({
        ...value,
        personType: 'external',
        sacraments: [],
        parents: {},
      })
      onCreated(result.data)
      onClose()
    } catch (nextError) {
      setError(nextError)
    }
  }
  return (
    <Modal title="Thêm người ngoài xứ" onClose={onClose} size="large">
      <form className={styles.quickForm} onSubmit={submit}>
        <Input
          label="Tên thánh"
          value={value.holyName}
          onChange={(event: any) => set('holyName', event.target.value)}
          maxLength={75}
        />
        <Input
          label="Họ và tên"
          value={value.fullName}
          error={error?.details?.fieldErrors?.fullName}
          onChange={(event: any) => set('fullName', event.target.value)}
          maxLength={120}
          required
        />
        <DateInput
          label="Ngày sinh"
          value={value.birthDate}
          onChange={(next: string) => set('birthDate', next)}
        />
        <Input
          label="Số điện thoại"
          value={value.phone}
          onChange={(event: any) => set('phone', event.target.value)}
          maxLength={20}
        />
        <Input
          label="Giáo xứ"
          value={value.parishName}
          onChange={(event: any) => set('parishName', event.target.value)}
          maxLength={120}
        />
        <Input
          label="Giáo phận"
          value={value.dioceseName}
          onChange={(event: any) => set('dioceseName', event.target.value)}
          maxLength={120}
        />
        <label className={styles.textareaField}>
          <span>Ghi chú</span>
          <textarea
            className={styles.textarea}
            value={value.note}
            onChange={(event) => set('note', event.target.value)}
            maxLength={2000}
          />
        </label>
        {error && !error?.details?.fieldErrors && (
          <p role="alert" className={styles.error}>
            {error.message}
          </p>
        )}
        <div className={styles.quickActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" isPending={create.isPending}>
            Lưu người ngoài xứ
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function PersonForm({
  initialValue,
  personType = 'parish',
  families,
  people = [],
  onSubmit,
  isPending,
  submitLabel,
  allowFamilyAssignment = false,
}: any) {
  const [value, setValue] = useState(() => ({ ...toFormValue(initialValue), personType }))
  const [quickParent, setQuickParent] = useState<any>(null)
  const [quickAdded, setQuickAdded] = useState<Record<string, any>>({})
  const [error, setError] = useState<any>(null)
  const fieldErrors = error?.details?.fieldErrors ?? {}
  const set = (key: string, next: string) => setValue({ ...value, [key]: next })
  const isExternal = value.personType === 'external'
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    try {
      await onSubmit(toPayload(value, allowFamilyAssignment, quickAdded))
    } catch (nextError) {
      setError(nextError)
    }
  }
  return (
    <form className={styles.form} onSubmit={submit}>
      <fieldset className={styles.group}>
        <h2>Thông tin định danh &amp; Hành chính</h2>
        <Input
          label="Tên thánh"
          value={value.holyName}
          error={fieldErrors.holyName}
          onChange={(event: any) => set('holyName', event.target.value)}
          maxLength={75}
        />
        <Input
          label="Họ và tên"
          value={value.fullName}
          error={fieldErrors.fullName}
          onChange={(event: any) => set('fullName', event.target.value)}
          required
          maxLength={120}
        />
        {!isExternal && (
          <Input
            label="Tên gọi"
            value={value.givenName}
            error={fieldErrors.givenName}
            onChange={(event: any) => set('givenName', event.target.value)}
            maxLength={50}
          />
        )}
        {!isExternal && (
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
        )}
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
        {isExternal && (
          <>
            <Input
              label="Giáo xứ"
              value={value.parishName}
              error={fieldErrors.parishName}
              onChange={(event: any) => set('parishName', event.target.value)}
              maxLength={120}
            />
            <Input
              label="Giáo phận"
              value={value.dioceseName}
              error={fieldErrors.dioceseName}
              onChange={(event: any) => set('dioceseName', event.target.value)}
              maxLength={120}
            />
          </>
        )}
        {!isExternal && (
          <>
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
          </>
        )}
      </fieldset>
      <fieldset className={`${styles.group} ${styles.parentGroup}`}>
        <h2>Cha mẹ</h2>
        {parentRoles.map((role) => {
          const mode = value[role.modeField]
          const selectedId = value[role.idField]
          return (
            <section key={role.key} className={styles.parentColumn}>
              <h3>{role.title}</h3>
              <Select
                label="Loại hồ sơ"
                value={mode}
                onChange={(event: any) => {
                  setValue((current: any) => ({
                    ...current,
                    [role.modeField]: event.target.value,
                    [role.idField]: '',
                  }))
                  setQuickAdded((current) => ({ ...current, [role.key]: null }))
                }}
              >
                <option value="internal">Thuộc giáo xứ</option>
                <option value="external">Ngoài giáo xứ</option>
              </Select>
              <div className={mode === 'external' ? styles.externalParentActions : undefined}>
                <SearchableSelect
                  label={
                    mode === 'internal'
                      ? `Chọn ${role.title.toLowerCase()}`
                      : `Chọn ${role.title.toLowerCase()} ngoài xứ`
                  }
                  value={selectedId}
                  options={people.filter(
                    (person: any) =>
                      person.personType === (mode === 'internal' ? 'parish' : 'external'),
                  )}
                  error={fieldErrors.parents}
                  emptyOptionLabel="Chưa liên kết hồ sơ"
                  placeholder={mode === 'internal' ? 'Tìm giáo dân...' : 'Tìm người ngoài xứ...'}
                  getOptionLabel={(person: any) => personName(person)}
                  getOptionValue={(person: any) => person.id}
                  onChange={(nextId: string) => {
                    set(role.idField, nextId)
                    if (nextId) setQuickAdded((current) => ({ ...current, [role.key]: null }))
                  }}
                />
                {mode === 'external' && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setQuickParent(role.key)}
                    >
                      Thêm người ngoài xứ
                    </Button>
                  </>
                )}
              </div>
              {mode === 'external' && quickAdded[role.key] && (
                <div className={styles.quickAdded}>
                  <strong>Đã thêm: {personName(quickAdded[role.key])}</strong>
                  {(quickAdded[role.key].parishName || quickAdded[role.key].dioceseName) && (
                    <span>
                      {[
                        quickAdded[role.key].parishName &&
                          `Giáo xứ: ${quickAdded[role.key].parishName}`,
                        quickAdded[role.key].dioceseName &&
                          `Giáo phận: ${quickAdded[role.key].dioceseName}`,
                      ]
                        .filter(Boolean)
                        .join(' | ')}
                    </span>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </fieldset>
      {quickParent && (
        <QuickExternalPersonModal
          onClose={() => setQuickParent(null)}
          onCreated={(person: any) => {
            const role = parentRoles.find((item) => item.key === quickParent)!
            setQuickAdded((current) => ({ ...current, [quickParent]: person }))
            setValue((current: any) => ({
              ...current,
              [role.idField]: current[role.idField] || person.id,
            }))
          }}
        />
      )}
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
          {!isExternal && (
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
          )}
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
        {!isExternal && (
          <DateInput
            label="Ngày qua đời"
            value={value.deathDate}
            error={fieldErrors.deathDate}
            onChange={(next: string) => set('deathDate', next)}
          />
        )}
        {!isExternal && (
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
        )}
        {!isExternal && (
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
        )}
        {!isExternal && (
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
        )}
        {allowFamilyAssignment && !isExternal && (
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
        {allowFamilyAssignment && !isExternal && value.familyId && (
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
        {!isExternal && (
          <label className={styles.textareaField}>
            <span>Ghi chú mục vụ</span>
            <textarea
              className={styles.textarea}
              value={value.pastoralNote}
              onChange={(event) => set('pastoralNote', event.target.value)}
              maxLength={2000}
            />
          </label>
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
      <Button type="submit" variant="primary" isPending={isPending} disabled={isPending}>
        {submitLabel}
      </Button>
    </form>
  )
}
