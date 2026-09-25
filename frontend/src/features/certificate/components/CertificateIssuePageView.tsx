import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { invoke } from '@/shared/invoke.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { usePerson } from '@/features/person/hooks/usePersons.ts'
import { personName } from '@/features/person/personName.ts'
import { useSettings } from '@/features/setting/hooks/useSettings.ts'
import styles from './CertificateIssuePageView.module.css'

const options = [
  { type: 'baptism', label: 'Rửa tội', source: 'baptism' },
  { type: 'confirmation', label: 'Thêm sức', source: 'confirmation' },
  { type: 'marriage', label: 'Hôn phối', source: 'marriage' },
] as const

const text = (value: unknown) => String(value ?? '')

export function CertificateIssuePageView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.add)
  const person = usePerson(id)
  const settings = useSettings()
  const [type, setType] = useState('baptism')
  const [registerBook, setRegisterBook] = useState('')
  const [registerPage, setRegisterPage] = useState('')
  const [registerEntry, setRegisterEntry] = useState('')
  const [selectedMarriageId, setSelectedMarriageId] = useState('')
  const [draft, setDraft] = useState<any>(null)
  const [isPending, setPending] = useState(false)
  const record = person.data
  const sacramentByType = useMemo(
    () => Object.fromEntries((record?.sacraments ?? []).map((item: any) => [item.type, item])),
    [record],
  )
  const available = options.filter((option) =>
    option.type === 'marriage'
      ? Boolean(record?.marriages?.length ?? record?.marriage)
      : Boolean(sacramentByType[option.source]),
  )

  const marriages = record?.marriages ?? (record?.marriage ? [record.marriage] : [])
  const selectedMarriage =
    marriages.find((item: any) => item.id === selectedMarriageId) ?? marriages[0]

  useEffect(() => {
    if (!record || !settings.data || draft) return
    if (
      !selectedMarriageId ||
      !marriages.some((marriage: any) => marriage.id === selectedMarriageId)
    ) {
      setSelectedMarriageId(marriages[0]?.id ?? '')
    }
    const source =
      type === 'marriage'
        ? (selectedMarriage ?? {})
        : (sacramentByType.baptism ?? sacramentByType.confirmation ?? {})
    if (!available.some((option) => option.type === type)) {
      setType(available[0]?.type ?? 'baptism')
    }
    setDraft({
      dioceseName: text(settings.data['general.dioceseName']),
      deaneryName: text(settings.data['general.deaneryName']),
      parishName: text(settings.data['general.parishName']),
      parishAddress: text(settings.data['general.parishAddress']),
      parishPhone: text(settings.data['general.parishPhone']),
      parishPriestName: text(settings.data['general.parishPriestName']),
      personName: text(record.fullName),
      holyName: text(record.holyName),
      birthDate: text(record.birthDate),
      birthPlace: '',
      fatherName: text(
        record.parents?.father ? personName(record.parents.father) : record.fatherName,
      ),
      motherName: text(
        record.parents?.mother ? personName(record.parents.mother) : record.motherName,
      ),
      ceremonyDate: text(source.date),
      ceremonyPlace: text(source.place),
      minister: text(source.minister),
      witnessOne: text(source.witnessOne),
      witnessTwo: text(source.witnessTwo),
      sponsor: '',
      spouseName: text(selectedMarriage?.spouseFullName),
      note: '',
    })
  }, [
    available,
    draft,
    record,
    sacramentByType,
    settings.data,
    selectedMarriage,
    selectedMarriageId,
    type,
  ])

  // The selected type intentionally refreshes only the source fields in the draft.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!draft) return
    const option = options.find((item) => item.type === type)
    const source =
      option?.type === 'marriage' ? selectedMarriage : sacramentByType[option?.source ?? '']
    setDraft((current: any) => ({
      ...current,
      ceremonyDate: text(source?.date),
      ceremonyPlace: text(source?.place),
      minister: text(source?.minister),
      witnessOne: text(source?.witnessOne),
      witnessTwo: text(source?.witnessTwo),
      spouseName: text(selectedMarriage?.spouseFullName),
    }))
    // Source fields are refreshed only when the selected type changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, selectedMarriage])

  if (person.isPending || settings.isPending || !draft) return <Skeleton />
  if (person.isError || !record) return null
  const set = (key: string, value: string) =>
    setDraft((current: any) => ({ ...current, [key]: value }))
  const selectedLabel = options.find((option) => option.type === type)?.label ?? 'chứng thư'

  const exportCertificate = async (event: any) => {
    event.preventDefault()
    setPending(true)
    try {
      const result: any = await invoke(
        window.api.certificate.issue({
          personId: record.id,
          type,
          marriageId: type === 'marriage' ? selectedMarriage?.id : undefined,
          registerBook,
          registerPage,
          registerEntry,
          draft,
        }),
      )
      if (!result.canceled) {
        addToast('Đã tạo chứng thư và ghi nhật ký phát hành.')
      }
    } catch (error: any) {
      addToast(error.message, true)
    } finally {
      setPending(false)
    }
  }

  return (
    <section className={styles.page}>
      <PageHeader title="Cấp chứng thư" description={personName(record)}>
        <Button onClick={() => navigate(`/persons/${record.id}`)}>Quay lại hồ sơ</Button>
      </PageHeader>
      <form className={styles.layout} onSubmit={exportCertificate}>
        <aside className={styles.sidebar} aria-labelledby="certificate-types-title">
          <h2 id="certificate-types-title">Chứng thư có thể cấp</h2>
          <div className={styles.typeList}>
            {options.map((option) => {
              const isAvailable = available.some((item) => item.type === option.type)
              return (
                <button
                  type="button"
                  key={option.type}
                  className={styles.typeButton}
                  data-selected={type === option.type}
                  disabled={!isAvailable}
                  onClick={() => setType(option.type)}
                >
                  <span>{option.label}</span>
                  <small>{isAvailable ? 'Có dữ liệu' : 'Chưa có dữ liệu'}</small>
                </button>
              )
            })}
          </div>
          <div className={styles.registerFields}>
            <h3>Thông tin sổ</h3>
            <Input
              label="Số quyển"
              value={registerBook}
              onChange={(event: any) => setRegisterBook(event.target.value)}
            />
            <Input
              label="Số tờ"
              value={registerPage}
              onChange={(event: any) => setRegisterPage(event.target.value)}
            />
            <Input
              label="Số thứ tự sổ"
              value={registerEntry}
              onChange={(event: any) => setRegisterEntry(event.target.value)}
            />
          </div>
        </aside>
        <div className={styles.previewColumn}>
          <div className={styles.previewHeader}>
            <div>
              <h2>Xem trước nội dung</h2>
              <p>{selectedLabel}</p>
            </div>
            <span className={styles.editHint}>Có thể chỉnh sửa trực tiếp</span>
          </div>
          <div className={styles.preview}>
            <section className={styles.previewSection}>
              {type === 'marriage' && marriages.length > 1 && (
                <Select
                  label="Hồ sơ hôn phối"
                  value={selectedMarriage?.id ?? ''}
                  onChange={(event: any) => {
                    setSelectedMarriageId(event.target.value)
                    setDraft(null)
                  }}
                >
                  {marriages.map((marriage: any, index: number) => (
                    <option key={marriage.id} value={marriage.id}>
                      {marriages.length - index} - {marriage.date} - {marriage.spouseFullName}
                    </option>
                  ))}
                </Select>
              )}
            </section>
            <section className={styles.previewSection}>
              <h3>Thông tin giáo xứ</h3>
              <div className={styles.previewFields}>
                <Input
                  label="Giáo phận"
                  value={draft.dioceseName}
                  onChange={(event: any) => set('dioceseName', event.target.value)}
                />
                <Input
                  label="Giáo hạt"
                  value={draft.deaneryName}
                  onChange={(event: any) => set('deaneryName', event.target.value)}
                />
                <Input
                  label="Giáo xứ"
                  value={draft.parishName}
                  onChange={(event: any) => set('parishName', event.target.value)}
                />
              </div>
            </section>
            <section className={styles.previewSection}>
              <h3>Liên hệ giáo xứ</h3>
              <div className={styles.previewFields}>
                <Input
                  label="Địa chỉ giáo xứ"
                  value={draft.parishAddress}
                  onChange={(event: any) => set('parishAddress', event.target.value)}
                />
                <Input
                  label="Số điện thoại giáo xứ"
                  value={draft.parishPhone}
                  onChange={(event: any) => set('parishPhone', event.target.value)}
                />
                <Input
                  label="Linh mục chánh xứ"
                  value={draft.parishPriestName}
                  onChange={(event: any) => set('parishPriestName', event.target.value)}
                />
              </div>
            </section>
            <section className={styles.previewSection}>
              <h3>Thông tin giáo dân</h3>
              <div className={styles.previewFields}>
                <Input
                  label="Họ và tên"
                  value={draft.personName}
                  onChange={(event: any) => set('personName', event.target.value)}
                />
                <Input
                  label="Tên thánh"
                  value={draft.holyName}
                  onChange={(event: any) => set('holyName', event.target.value)}
                />
                <Input
                  label="Ngày sinh"
                  value={draft.birthDate}
                  onChange={(event: any) => set('birthDate', event.target.value)}
                />
                <Input
                  label="Nơi sinh"
                  value={draft.birthPlace}
                  onChange={(event: any) => set('birthPlace', event.target.value)}
                />
              </div>
            </section>
            <section className={styles.previewSection}>
              <h3>Thông tin gia đình</h3>
              <div className={styles.previewFields}>
                <Input
                  label="Tên cha"
                  value={draft.fatherName}
                  onChange={(event: any) => set('fatherName', event.target.value)}
                />
                <Input
                  label="Tên mẹ"
                  value={draft.motherName}
                  onChange={(event: any) => set('motherName', event.target.value)}
                />
              </div>
            </section>
            <section className={styles.previewSection}>
              <h3>Thông tin bí tích</h3>
              <div className={styles.previewFields}>
                <Input
                  label="Ngày cử hành"
                  value={draft.ceremonyDate}
                  onChange={(event: any) => set('ceremonyDate', event.target.value)}
                />
                <Input
                  label="Nơi cử hành"
                  value={draft.ceremonyPlace}
                  onChange={(event: any) => set('ceremonyPlace', event.target.value)}
                />
                <Input
                  label="Linh mục cử hành"
                  value={draft.minister}
                  onChange={(event: any) => set('minister', event.target.value)}
                />
                {type === 'marriage' && (
                  <>
                    <Input
                      label="Người chứng hôn thứ nhất"
                      value={draft.witnessOne}
                      onChange={(event: any) => set('witnessOne', event.target.value)}
                    />
                    <Input
                      label="Người chứng hôn thứ hai"
                      value={draft.witnessTwo}
                      onChange={(event: any) => set('witnessTwo', event.target.value)}
                    />
                  </>
                )}
              </div>
            </section>
            <section className={styles.previewSection}>
              <h3>Người đỡ đầu và ghi chú</h3>
              <div className={styles.previewFields}>
                <Input
                  label="Người đỡ đầu"
                  value={draft.sponsor}
                  onChange={(event: any) => set('sponsor', event.target.value)}
                />
                <Input
                  label="Ghi chú sổ Rửa tội"
                  value={draft.note}
                  onChange={(event: any) => set('note', event.target.value)}
                />
                {type === 'marriage' && (
                  <Input
                    label="Người phối ngẫu"
                    value={draft.spouseName}
                    onChange={(event: any) => set('spouseName', event.target.value)}
                  />
                )}
              </div>
            </section>
          </div>
          <div className={styles.exportActions}>
            <Button
              type="submit"
              variant="primary"
              isPending={isPending}
              disabled={!available.length}
            >
              Xuất chứng thư PDF
            </Button>
          </div>
        </div>
      </form>
    </section>
  )
}
