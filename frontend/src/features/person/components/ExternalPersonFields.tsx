import { type ReactNode, useId } from 'react'
import { DateInput } from '@/components/ui/DateInput.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { HolyNameInput } from '@/components/ui/HolyNameInput.tsx'
import { BirthPlaceInput } from '@/components/ui/BirthPlaceInput.tsx'
import { ParishNameInput } from '@/features/setting/components/ParishNameInput.tsx'
import styles from './ExternalPersonFields.module.css'

const defaultFields = Object.freeze({
  holyName: 'holyName',
  fullName: 'fullName',
  birthDate: 'birthDate',
  birthPlace: 'birthPlace',
  parishName: 'parishName',
  dioceseName: 'dioceseName',
  baptismDate: 'baptismDate',
  baptismPlace: 'baptismPlace',
  baptismSponsor: 'baptismSponsor',
  confirmationDate: 'confirmationDate',
  confirmationPlace: 'confirmationPlace',
  confirmationSponsor: 'confirmationSponsor',
  phone: 'phone',
  note: 'note',
})

/** Khối nhập liệu dùng chung cho người ngoài xứ trong hôn phối và hồ sơ cha/mẹ. */
export function ExternalPersonForm({
  value,
  onChange,
  fieldErrors = {},
  fields = defaultFields,
  showSacraments = true,
  children,
  footer,
}: {
  value: Record<string, string>
  onChange: (field: string, next: string) => void
  fieldErrors?: Record<string, string>
  fields?: Record<string, string>
  showSacraments?: boolean
  children?: ReactNode
  footer?: ReactNode
}) {
  const fieldId = useId()
  const get = (key: string) => value[fields[key]] ?? ''
  const set = (key: string, next: string) => onChange(fields[key], next)
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <strong>Thông tin người ngoài giáo xứ</strong>
        <span>Chỉ tạo hồ sơ giáo dân ngoài xứ, hồ sơ này không dùng để quản lý và thống kê</span>
      </div>
      <section className={styles.group}>
        <h4>Thông tin cá nhân</h4>
        <div className={styles.grid}>
          <HolyNameInput label="Tên thánh" value={get('holyName')} onChange={(event: any) => set('holyName', event.target.value)} maxLength={75} />
          <Input label="Họ và tên" value={get('fullName')} error={fieldErrors[fields.fullName]} onChange={(event: any) => set('fullName', event.target.value)} maxLength={120} required />
          <DateInput label="Ngày sinh" value={get('birthDate')} error={fieldErrors[fields.birthDate]} onChange={(date: string) => set('birthDate', date)} />
          <BirthPlaceInput label="Nơi sinh" value={get('birthPlace')} error={fieldErrors[fields.birthPlace]} onChange={(event: any) => set('birthPlace', event.target.value)} maxLength={255} />
          <ParishNameInput label="Giáo xứ" value={get('parishName')} onChange={(event: any) => set('parishName', event.target.value)} />
          <Input label="Giáo phận" value={get('dioceseName')} onChange={(event: any) => set('dioceseName', event.target.value)} maxLength={120} />
        </div>
      </section>
      {showSacraments && (
        <section className={styles.group}>
          <h4>Các bí tích</h4>
          <div className={styles.sacramentCards}>
            <section className={styles.sacramentCard} aria-labelledby={`${fieldId}-baptism-title`}>
              <h5 id={`${fieldId}-baptism-title`}>Rửa tội</h5>
              <div className={styles.sacramentFields}>
                <DateInput label="Ngày cử hành" value={get('baptismDate')} onChange={(date: string) => set('baptismDate', date)} />
                <ParishNameInput label="Nơi cử hành" value={get('baptismPlace')} onChange={(event: any) => set('baptismPlace', event.target.value)} />
                <Input label="Người đỡ đầu" value={get('baptismSponsor')} onChange={(event: any) => set('baptismSponsor', event.target.value)} maxLength={120} />
              </div>
            </section>
            <section className={styles.sacramentCard} aria-labelledby={`${fieldId}-confirmation-title`}>
              <h5 id={`${fieldId}-confirmation-title`}>Thêm sức</h5>
              <div className={styles.sacramentFields}>
                <DateInput label="Ngày cử hành" value={get('confirmationDate')} onChange={(date: string) => set('confirmationDate', date)} />
                <ParishNameInput label="Nơi cử hành" value={get('confirmationPlace')} onChange={(event: any) => set('confirmationPlace', event.target.value)} />
                <Input label="Người đỡ đầu" value={get('confirmationSponsor')} onChange={(event: any) => set('confirmationSponsor', event.target.value)} maxLength={120} />
              </div>
            </section>
          </div>
        </section>
      )}
      {children}
      <section className={styles.group}>
        <h4>Liên hệ</h4>
        <div className={styles.contact}>
          <Input
            label="Số điện thoại"
            value={get('phone')}
            error={fieldErrors[fields.phone]}
            onChange={(event: any) => set('phone', event.target.value)}
            maxLength={20}
          />
          <label className={styles.textareaField}>
            <span>Ghi chú</span>
            <textarea
              className={styles.textarea}
              value={get('note')}
              onChange={(event) => set('note', event.target.value)}
              maxLength={2000}
            />
          </label>
        </div>
      </section>
      {footer}
    </div>
  )
}
