import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useCreateZone } from '../hooks/useZoneMutations.ts'
import { useZones } from '../hooks/useZones.ts'
import { ZoneForm } from './ZoneForm.tsx'

export function ZoneList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const search = searchParams.get('q') ?? ''
  const filter = useMemo(
    () => ({ page: 1, pageSize: 50, search, sortBy: 'name', sortDir: 'asc' }),
    [search],
  )
  const query = useZones(filter)
  const create = useCreateZone()
  const rows = query.data?.data ?? []
  const updateSearch = (value: string) => setSearchParams(value ? { q: value } : {})

  return (
    <section>
      <PageHeader
        title="Giáo họ"
        description="Quản lý giáo họ và số hộ, giáo dân thuộc từng giáo họ."
      >
        <Button onClick={() => setCreateOpen(true)}>Thêm giáo họ</Button>
      </PageHeader>
      <Input
        label="Tìm giáo họ"
        value={search}
        onChange={(event: any) => updateSearch(event.target.value)}
      />
      {query.isLoading && <Skeleton />}
      {query.isError && <ErrorState error={query.error} onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && rows.length === 0 && !search && (
        <EmptyState
          title="Chưa có giáo họ"
          actionLabel="Tạo giáo họ"
          onAction={() => setCreateOpen(true)}
        >
          Hãy tạo giáo họ trước khi thêm gia đình và giáo dân.
        </EmptyState>
      )}
      {!query.isLoading && !query.isError && rows.length === 0 && search && (
        <EmptyState
          title="Không có kết quả khớp bộ lọc"
          actionLabel="Xoá bộ lọc"
          onAction={() => updateSearch('')}
        >
          Hãy thử từ khoá khác.
        </EmptyState>
      )}
      {rows.length > 0 && (
        <Table
          caption="Danh sách giáo họ"
          rows={rows}
          columns={[
            {
              key: 'name',
              label: 'Tên giáo họ',
              render: (row: any) => <Link to={`/zones/${row.id}`}>{row.name}</Link>,
            },
            { key: 'holyName', label: 'Bổn mạng' },
            { key: 'familyCount', label: 'Số hộ' },
            { key: 'personCount', label: 'Số giáo dân' },
          ]}
        />
      )}
      {isCreateOpen && (
        <Modal title="Thêm giáo họ" onClose={() => setCreateOpen(false)}>
          <ZoneForm
            submitLabel="Tạo giáo họ"
            isPending={create.isPending}
            onSubmit={async (input: any) => {
              await create.mutateAsync(input)
              setCreateOpen(false)
            }}
          />
        </Modal>
      )}
    </section>
  )
}
