import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { DateInput } from '@/components/ui/DateInput.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { SearchableSelect } from '@/components/ui/SearchableSelect.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useComposedSearch } from '@/hooks/useComposedSearch.ts'
import { invoke, invokeWithMeta } from '@/shared/invoke.ts'
import styles from './Marriage.module.css'

const marriageApi = {
  list: (search: string) =>
    invokeWithMeta(window.api.marriage.list({ page: 1, pageSize: 50, search })),
  create: (input: any) => invoke(window.api.marriage.create(input)),
  update: (input: any) => invoke(window.api.marriage.update(input)),
  remove: (id: string) => invoke(window.api.marriage.remove(id)),
}

function toMarriagePayload(input: any) {
  const payload = { ...input }
  delete payload.spouseMode
  payload.spouseId = input.spouseMode === 'internal' ? input.spouseId : null
  payload.spouseBirthDate = payload.spouseBirthDate || null
  return payload
}

function toFormValue(initialValue: any) {
  const participants = initialValue?.participants ?? []
  return {
    personId: initialValue?.personId ?? participants[0]?.personId ?? '',
    spouseMode: initialValue ? (initialValue.spouseId ? 'internal' : 'external') : 'internal',
    spouseId: initialValue?.spouseId ?? participants[1]?.personId ?? '',
    spouseName: initialValue?.spouseName ?? participants[1]?.fullName ?? '',
    spouseHolyName: initialValue?.spouseHolyName ?? '',
    spouseBirthDate: initialValue?.spouseBirthDate ?? '',
    spouseParishName: initialValue?.spouseParishName ?? '',
    spouseDioceseName: initialValue?.spouseDioceseName ?? '',
    spouseBaptismDate: initialValue?.spouseBaptismDate ?? '',
    spouseBaptismPlace: initialValue?.spouseBaptismPlace ?? '',
    spouseConfirmationDate: initialValue?.spouseConfirmationDate ?? '',
    spouseConfirmationPlace: initialValue?.spouseConfirmationPlace ?? '',
    spouseFatherName: initialValue?.spouseFatherName ?? '',
    spouseMotherName: initialValue?.spouseMotherName ?? '',
    date: initialValue?.date ?? '',
    minister: initialValue?.minister ?? '',
    place: initialValue?.place ?? '',
    status: initialValue?.status ?? 'married',
    note: initialValue?.note ?? '',
    witnessOne: initialValue?.witnessOne ?? '',
    witnessTwo: initialValue?.witnessTwo ?? '',
  }
}

function MarriageForm({
  initialValue,
  persons,
  onPersonSearchChange,
  onSubmit,
  isPending,
  submitLabel,
  personsLoading,
}: any) {
  const [value, setValue] = useState(() => toFormValue(initialValue))
  const [error, setError] = useState<any>(null)
  const [selectedPeople, setSelectedPeople] = useState<any[]>([])
  const firstPersonQuery = useQuery({
    queryKey: ['person', 'marriage-warning', value.personId],
    queryFn: () => invoke(window.api.person.getById(value.personId)),
    enabled: Boolean(value.personId),
  })
  const spousePersonQuery = useQuery({
    queryKey: ['person', 'marriage-warning', value.spouseId],
    queryFn: () => invoke(window.api.person.getById(value.spouseId)),
    enabled: value.spouseMode === 'internal' && Boolean(value.spouseId),
  })
  const fieldErrors = error?.details?.fieldErrors ?? {}
  const fieldErrorSummary = Object.entries(fieldErrors)
    .map(([field, message]) => {
      const labels: Record<string, string> = {
        personId: 'Đương sự thứ nhất',
        spouseId: 'Người phối ngẫu',
        spouseName: 'Tên người phối ngẫu',
        date: 'Ngày hôn phối',
        status: 'Trạng thái hôn phối',
        note: 'Ghi chú',
      }
      return `${labels[field] ?? field}: ${message}`
    })
    .join(' | ')
  const personOptions = useMemo(() => {
    const fallbackOptions = [
      initialValue?.personId && initialValue?.personName
        ? { id: initialValue.personId, fullName: initialValue.personName }
        : null,
      initialValue?.spouseId && initialValue?.spouseName
        ? { id: initialValue.spouseId, fullName: initialValue.spouseName }
        : null,
    ].filter(Boolean)
    const merged = [...fallbackOptions, ...selectedPeople, ...persons]
    return merged.filter(
      (person: any, index: number) =>
        merged.findIndex((item: any) => item.id === person.id) === index,
    )
  }, [initialValue, persons, selectedPeople])
  const spouseOptions = useMemo(
    () => personOptions.filter((person: any) => person.id !== value.personId),
    [personOptions, value.personId],
  )
  const existingMarriageWarnings = [
    { person: firstPersonQuery.data, marriage: firstPersonQuery.data?.marriage },
    { person: spousePersonQuery.data, marriage: spousePersonQuery.data?.marriage },
  ].filter(({ marriage }) => marriage && marriage.id !== initialValue?.id)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const nextFieldErrors: Record<string, string> = {}
    if (!value.personId) nextFieldErrors.personId = 'Hãy chọn đương sự thứ nhất'
    if (value.spouseMode === 'internal' && !value.spouseId) {
      nextFieldErrors.spouseId = 'Hãy chọn người phối ngẫu thuộc giáo xứ'
    }
    if (value.spouseMode === 'external' && !value.spouseName.trim()) {
      nextFieldErrors.spouseName = 'Hãy nhập tên người phối ngẫu ngoài giáo xứ'
    }
    if (!value.date) nextFieldErrors.date = 'Hãy nhập ngày hôn phối'
    if (Object.keys(nextFieldErrors).length) {
      setError({
        message: 'Vui lòng bổ sung các thông tin bắt buộc trước khi lưu.',
        details: { fieldErrors: nextFieldErrors },
      })
      return
    }
    try {
      await onSubmit(value)
    } catch (nextError) {
      setError(nextError)
    }
  }
  const selectPerson = (field: 'personId' | 'spouseId', nextId: string) => {
    const selectedPerson = personOptions.find((person: any) => String(person.id) === nextId)
    if (selectedPerson) {
      setSelectedPeople((current) => [
        ...current.filter((person) => person.id !== selectedPerson.id),
        selectedPerson,
      ])
    }
    setValue((current: any) => ({ ...current, [field]: nextId }))
  }
  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <section className={styles.formSection} aria-labelledby="marriage-parties-heading">
        <div className={styles.sectionHeader}>
          <div>
            <h3 id="marriage-parties-heading">Các đương sự</h3>
            <p>Chọn người đang có hồ sơ tại giáo xứ.</p>
          </div>
          <span className={styles.sectionStep}>01</span>
        </div>
        <div className={styles.fieldGrid}>
          <div className={styles.stackedField}>
            <SearchableSelect
              label="Đương sự thứ nhất"
              value={value.personId}
              options={personOptions}
              error={fieldErrors.personId}
              placeholder="Tìm tên giáo dân..."
              getOptionLabel={(person: any) => person.fullName}
              getOptionValue={(person: any) => person.id}
              onChange={(nextId: string) => selectPerson('personId', nextId)}
              onSearchChange={onPersonSearchChange}
              loading={personsLoading}
              required
            />
          </div>
          <Select
            label="Loại người phối ngẫu"
            value={value.spouseMode}
            onChange={(event: any) =>
              setValue({
                ...value,
                spouseMode: event.target.value,
                spouseId: event.target.value === 'internal' ? value.spouseId : '',
              })
            }
          >
            <option value="internal">Thuộc giáo xứ</option>
            <option value="external">Ngoài giáo xứ</option>
          </Select>
        </div>
        {value.spouseMode === 'internal' ? (
          <SearchableSelect
            label="Người phối ngẫu"
            value={value.spouseId}
            options={spouseOptions}
            error={fieldErrors.spouseId || fieldErrors.spouseName}
            placeholder="Tìm tên người phối ngẫu..."
            getOptionLabel={(person: any) => person.fullName}
            getOptionValue={(person: any) => person.id}
            onChange={(nextId: string) => selectPerson('spouseId', nextId)}
            onSearchChange={onPersonSearchChange}
            loading={personsLoading}
            required
          />
        ) : (
          <div className={styles.externalPanel}>
            <div className={styles.panelHeader}>
              <strong>Thông tin người ngoài giáo xứ</strong>
              <span>Không tạo hồ sơ giáo dân mới</span>
            </div>
            <div className={styles.externalGroup}>
              <h4>Thông tin cá nhân</h4>
              <div className={styles.externalGroupGrid}>
                <Input
                  label="Họ tên"
                  value={value.spouseName}
                  error={fieldErrors.spouseName}
                  onChange={(event: any) => setValue({ ...value, spouseName: event.target.value })}
                  maxLength={120}
                  required
                />
                <Input
                  label="Tên thánh"
                  value={value.spouseHolyName}
                  onChange={(event: any) =>
                    setValue({ ...value, spouseHolyName: event.target.value })
                  }
                  maxLength={75}
                />
                <DateInput
                  label="Ngày sinh"
                  value={value.spouseBirthDate}
                  onChange={(date: string) => setValue({ ...value, spouseBirthDate: date })}
                />
                <Input
                  label="Giáo xứ"
                  value={value.spouseParishName}
                  onChange={(event: any) =>
                    setValue({ ...value, spouseParishName: event.target.value })
                  }
                  maxLength={120}
                />
                <Input
                  label="Giáo phận"
                  value={value.spouseDioceseName}
                  onChange={(event: any) =>
                    setValue({ ...value, spouseDioceseName: event.target.value })
                  }
                  maxLength={120}
                />
              </div>
            </div>
            <div className={styles.externalGroup}>
              <h4>Các bí tích</h4>
              <div className={styles.sacramentGrid}>
                <DateInput
                  label="Ngày Rửa tội"
                  value={value.spouseBaptismDate}
                  onChange={(date: string) => setValue({ ...value, spouseBaptismDate: date })}
                />
                <Input
                  label="Nơi cử hành Rửa tội"
                  value={value.spouseBaptismPlace}
                  onChange={(event: any) =>
                    setValue({ ...value, spouseBaptismPlace: event.target.value })
                  }
                  maxLength={255}
                />
                <DateInput
                  label="Ngày Thêm sức"
                  value={value.spouseConfirmationDate}
                  onChange={(date: string) => setValue({ ...value, spouseConfirmationDate: date })}
                />
                <Input
                  label="Nơi cử hành Thêm sức"
                  value={value.spouseConfirmationPlace}
                  onChange={(event: any) =>
                    setValue({ ...value, spouseConfirmationPlace: event.target.value })
                  }
                  maxLength={255}
                />
              </div>
            </div>
            <div className={styles.externalGroup}>
              <h4>Thông tin gia đình</h4>
              <div className={styles.externalGroupGrid}>
                <Input
                  label="Tên cha"
                  value={value.spouseFatherName}
                  onChange={(event: any) =>
                    setValue({ ...value, spouseFatherName: event.target.value })
                  }
                  maxLength={120}
                />
                <Input
                  label="Tên mẹ"
                  value={value.spouseMotherName}
                  onChange={(event: any) =>
                    setValue({ ...value, spouseMotherName: event.target.value })
                  }
                  maxLength={120}
                />
              </div>
            </div>
          </div>
        )}
        {existingMarriageWarnings.length > 0 && (
          <div className={styles.warning} role="alert">
            <strong>CẢNH BÁO: đương sự đã có lịch sử hôn phối.</strong>
            <span>
              {existingMarriageWarnings
                .map(({ person }) => person?.fullName)
                .filter(Boolean)
                .join(' và ')}
              {' đã có hồ sơ trước đó.'}
            </span>
            <span>Hồ sơ mới vẫn được lưu và không thay thế các hôn phối trước đó.</span>
          </div>
        )}
      </section>
      <section
        className={`${styles.formSection} ${styles.ceremonySection}`}
        aria-labelledby="marriage-ceremony-heading"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h3 id="marriage-ceremony-heading">Thông tin cử hành</h3>
            <p>Thông tin được dùng trong sổ hôn phối và chứng thư.</p>
          </div>
          <span className={styles.sectionStep}>02</span>
        </div>
        <div className={styles.fieldGrid}>
          <Select
            label="Trạng thái hôn phối"
            value={value.status}
            onChange={(event: any) => setValue({ ...value, status: event.target.value })}
          >
            <option value="married">Kết hôn</option>
            <option value="annulled">Tiêu hôn</option>
          </Select>
          <DateInput
            label="Ngày hôn phối"
            value={value.date}
            error={fieldErrors.date}
            onChange={(date: string) => setValue({ ...value, date })}
            required
          />
          <Input
            label="Linh mục cử hành"
            value={value.minister}
            error={fieldErrors.minister}
            onChange={(event: any) => setValue({ ...value, minister: event.target.value })}
            maxLength={120}
          />
          <Input
            label="Người chứng hôn thứ nhất"
            value={value.witnessOne}
            onChange={(event: any) => setValue({ ...value, witnessOne: event.target.value })}
            maxLength={120}
          />
          <Input
            label="Người chứng hôn thứ hai"
            value={value.witnessTwo}
            onChange={(event: any) => setValue({ ...value, witnessTwo: event.target.value })}
            maxLength={120}
          />
          <Input
            label="Nơi cử hành"
            value={value.place}
            error={fieldErrors.place}
            onChange={(event: any) => setValue({ ...value, place: event.target.value })}
            maxLength={255}
          />
          <Input
            label="Ghi chú"
            value={value.note}
            onChange={(event: any) => setValue({ ...value, note: event.target.value })}
            maxLength={1000}
          />
        </div>
      </section>
      {error && (
        <p role="alert" className={styles.error}>
          {error.message || 'Không thể lưu hôn phối. Vui lòng kiểm tra lại thông tin.'}
          {fieldErrorSummary && <span> {fieldErrorSummary}</span>}
        </p>
      )}
      <div className={styles.formFooter}>
        <span>Kiểm tra thông tin trước khi lưu.</span>
        <Button type="submit" isPending={isPending} disabled={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export function MarriageList() {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [removing, setRemoving] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [personSearch, setPersonSearch] = useState('')
  const client = useQueryClient()
  const marriageFilter = useMemo(() => ({ search }), [search])
  const marriages = useQuery({
    queryKey: ['marriage', 'list', marriageFilter],
    queryFn: () => marriageApi.list(search),
  })
  const persons = useQuery({
    queryKey: ['person', 'marriage-options', personSearch],
    queryFn: () =>
      invokeWithMeta(
        window.api.person.list({
          page: 1,
          pageSize: 200,
          search: personSearch || undefined,
          sortBy: 'fullName',
          sortDir: 'asc',
        }),
      ),
  })
  const create = useMutation({
    mutationFn: marriageApi.create,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['marriage'] })
      client.invalidateQueries({ queryKey: ['person'] })
    },
  })
  const update = useMutation({
    mutationFn: marriageApi.update,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['marriage'] })
      client.invalidateQueries({ queryKey: ['person'] })
    },
  })
  const remove = useMutation({
    mutationFn: marriageApi.remove,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['marriage'] })
      client.invalidateQueries({ queryKey: ['person'] })
    },
  })
  const rows = marriages.data?.data ?? []
  const updateSearch = (value: string) => setSearch(value)
  const marriageSearch = useComposedSearch(search, updateSearch)
  // Person searches belong to the modal; do not replace the marriage list with a
  // page-level skeleton while a new dropdown query is loading.
  const showInitialLoading = marriages.isLoading || (persons.isLoading && !isCreateOpen && !editing)
  const showPersonsError = persons.isError && !isCreateOpen && !editing
  return (
    <section>
      <PageHeader title="Hôn phối" description="Quản lý thông tin hôn phối chung của hai giáo dân.">
        <Button
          onClick={() => {
            setPersonSearch('')
            setCreateOpen(true)
          }}
          disabled={persons.isLoading || (persons.data?.data ?? []).length < 1}
        >
          Thêm hôn phối
        </Button>
      </PageHeader>
      {showInitialLoading && <Skeleton />}
      {marriages.isError && <ErrorState error={marriages.error} onRetry={marriages.refetch} />}
      {showPersonsError && <ErrorState error={persons.error} onRetry={persons.refetch} />}
      <div className={styles.filters}>
        <Input label="Tìm đương sự theo tên" {...marriageSearch} />
      </div>
      {!marriages.isLoading && !marriages.isError && rows.length === 0 && !search && (
        <EmptyState
          title="Chưa có hôn phối"
          actionLabel="Thêm hôn phối"
          onAction={() => setCreateOpen(true)}
        >
          Tạo một bản ghi để liên kết hai giáo dân.
        </EmptyState>
      )}
      {!marriages.isLoading && !marriages.isError && rows.length === 0 && search && (
        <EmptyState
          title="Không tìm thấy hôn phối"
          actionLabel="Xoá tìm kiếm"
          onAction={() => updateSearch('')}
        >
          Hãy thử họ tên của một trong hai đương sự.
        </EmptyState>
      )}
      {rows.length > 0 && (
        <Table
          caption="Danh sách hôn phối"
          rows={rows}
          onRowActivate={(row: any) => setEditing(row)}
          onRowDelete={(row: any) => setRemoving(row)}
          columns={[
            {
              key: 'participants',
              label: 'Hai đương sự',
              render: (row: any) => {
                const names = String(row.participantNames || row.participants || '').split('|')
                const holyNames = row.participantHolyNames ?? []
                return (
                  <div className={styles.participantList}>
                    {names.map((name: string, index: number) => (
                      <span key={`${name}-${index}`}>
                        {holyNames[index] ? `${holyNames[index]} ` : ''}
                        {name}
                      </span>
                    ))}
                  </div>
                )
              },
            },
            { key: 'date', label: 'Ngày hôn phối' },
            {
              key: 'status',
              label: 'Trạng thái',
              render: (row: any) => (row.status === 'annulled' ? 'Tiêu hôn' : 'Kết hôn'),
            },
            {
              key: 'note',
              label: 'Ghi chú',
              render: (row: any) => row.note || 'Chưa cập nhật',
            },
            {
              key: 'minister',
              label: 'Linh mục cử hành',
              render: (row: any) => row.minister || 'Chưa cập nhật',
            },
            {
              key: 'place',
              label: 'Nơi cử hành',
              render: (row: any) => row.place || 'Chưa cập nhật',
            },
            {
              key: 'actions',
              label: 'Thao tác',
              render: (row: any) => (
                <div className={styles.actions}>
                  <Button onClick={() => setEditing(row)}>Sửa</Button>
                  <Button variant="danger" onClick={() => setRemoving(row)}>
                    Xoá
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}
      {isCreateOpen && (
        <Modal
          title="Thêm hôn phối"
          size="wide"
          onClose={() => {
            setCreateOpen(false)
            setPersonSearch('')
          }}
        >
          <MarriageForm
            persons={persons.data?.data ?? []}
            onPersonSearchChange={setPersonSearch}
            personsLoading={persons.isFetching}
            isPending={create.isPending}
            submitLabel="Lưu hôn phối"
            onSubmit={async (input: any) => {
              await create.mutateAsync(toMarriagePayload(input))
              setCreateOpen(false)
              setPersonSearch('')
            }}
          />
        </Modal>
      )}
      {editing && (
        <Modal
          title="Sửa hôn phối"
          size="wide"
          onClose={() => {
            setEditing(null)
            setPersonSearch('')
          }}
        >
          <MarriageForm
            initialValue={editing}
            persons={persons.data?.data ?? []}
            onPersonSearchChange={setPersonSearch}
            personsLoading={persons.isFetching}
            isPending={update.isPending}
            submitLabel="Cập nhật hôn phối"
            onSubmit={async (patch: any) => {
              await update.mutateAsync({
                id: editing.id,
                expectedUpdatedAt: editing.updatedAt,
                patch: toMarriagePayload(patch),
              })
              setEditing(null)
              setPersonSearch('')
            }}
          />
        </Modal>
      )}
      {removing && (
        <ConfirmDialog
          title="Xoá hôn phối"
          confirmLabel="Xoá hôn phối"
          isPending={remove.isPending}
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await remove.mutateAsync(removing.id)
            setRemoving(null)
          }}
        >
          Bạn có chắc muốn xoá mềm thông tin hôn phối của {removing.participants}?
        </ConfirmDialog>
      )}
    </section>
  )
}
