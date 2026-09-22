import { useState, type FormEvent } from 'react'
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
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { invoke, invokeWithMeta } from '@/shared/invoke.ts'
import styles from './Marriage.module.css'

const marriageApi = {
  list: () => invokeWithMeta(window.api.marriage.list({ page: 1, pageSize: 200 })),
  create: (input: any) => invoke(window.api.marriage.create(input)),
  update: (input: any) => invoke(window.api.marriage.update(input)),
  remove: (id: string) => invoke(window.api.marriage.remove(id)),
}

function toFormValue(initialValue: any) {
  const participants = initialValue?.participants ?? []
  return {
    personId: initialValue?.personId ?? participants[0]?.personId ?? '',
    spouseId: initialValue?.spouseId ?? participants[1]?.personId ?? '',
    date: initialValue?.date ?? '',
    minister: initialValue?.minister ?? '',
    place: initialValue?.place ?? '',
  }
}

function MarriageForm({ initialValue, persons, onSubmit, isPending, submitLabel }: any) {
  const [value, setValue] = useState(() => toFormValue(initialValue))
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
        label="Đương sự thứ nhất"
        value={value.personId}
        error={fieldErrors.personId}
        onChange={(event: any) => setValue({ ...value, personId: event.target.value })}
        required
      >
        <option value="">Chọn giáo dân</option>
        {persons.map((person: any) => (
          <option key={person.id} value={person.id}>
            {person.fullName}
          </option>
        ))}
      </Select>
      <Select
        label="Người phối ngẫu"
        value={value.spouseId}
        error={fieldErrors.spouseId}
        onChange={(event: any) => setValue({ ...value, spouseId: event.target.value })}
        required
      >
        <option value="">Chọn giáo dân</option>
        {persons
          .filter((person: any) => person.id !== value.personId)
          .map((person: any) => (
            <option key={person.id} value={person.id}>
              {person.fullName}
            </option>
          ))}
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
        label="Nơi cử hành"
        value={value.place}
        error={fieldErrors.place}
        onChange={(event: any) => setValue({ ...value, place: event.target.value })}
        maxLength={255}
      />
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

export function MarriageList() {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [removing, setRemoving] = useState<any>(null)
  const client = useQueryClient()
  const marriages = useQuery({ queryKey: ['marriage', 'list'], queryFn: marriageApi.list })
  const persons = useQuery({
    queryKey: ['person', 'marriage-options'],
    queryFn: () =>
      invokeWithMeta(
        window.api.person.list({ page: 1, pageSize: 200, sortBy: 'fullName', sortDir: 'asc' }),
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
  return (
    <section>
      <PageHeader title="Hôn phối" description="Quản lý thông tin hôn phối chung của hai giáo dân.">
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={persons.isLoading || (persons.data?.data ?? []).length < 2}
        >
          Thêm hôn phối
        </Button>
      </PageHeader>
      {(marriages.isLoading || persons.isLoading) && <Skeleton />}
      {marriages.isError && <ErrorState error={marriages.error} onRetry={marriages.refetch} />}
      {persons.isError && <ErrorState error={persons.error} onRetry={persons.refetch} />}
      {!marriages.isLoading && !marriages.isError && rows.length === 0 && (
        <EmptyState
          title="Chưa có hôn phối"
          actionLabel="Thêm hôn phối"
          onAction={() => setCreateOpen(true)}
        >
          Tạo một bản ghi để liên kết hai giáo dân.
        </EmptyState>
      )}
      {rows.length > 0 && (
        <Table
          caption="Danh sách hôn phối"
          rows={rows}
          onRowActivate={(row: any) => setEditing(row)}
          onRowDelete={(row: any) => setRemoving(row)}
          columns={[
            { key: 'participants', label: 'Hai đương sự' },
            { key: 'date', label: 'Ngày hôn phối' },
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
        <Modal title="Thêm hôn phối" onClose={() => setCreateOpen(false)}>
          <MarriageForm
            persons={persons.data?.data ?? []}
            isPending={create.isPending}
            submitLabel="Lưu hôn phối"
            onSubmit={async (input: any) => {
              await create.mutateAsync(input)
              setCreateOpen(false)
            }}
          />
        </Modal>
      )}
      {editing && (
        <Modal title="Sửa hôn phối" onClose={() => setEditing(null)}>
          <MarriageForm
            initialValue={editing}
            persons={persons.data?.data ?? []}
            isPending={update.isPending}
            submitLabel="Cập nhật hôn phối"
            onSubmit={async (patch: any) => {
              await update.mutateAsync({
                id: editing.id,
                expectedUpdatedAt: editing.updatedAt,
                patch,
              })
              setEditing(null)
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
