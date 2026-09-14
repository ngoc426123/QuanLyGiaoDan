import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Pagination } from '@/components/ui/Pagination.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useCreateZone } from '../hooks/useZoneMutations.ts'
import { useZones } from '../hooks/useZones.ts'
import { ZoneForm } from './ZoneForm.tsx'
import { ZoneBulkActions } from './ZoneBulkActions.tsx'
import { selectedIdsFor, useSelectionStore } from '@/stores/selection.store.ts'
import { RowContextMenu } from '@/components/ui/RowContextMenu.tsx'

export function ZoneList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<any>(null)
  const navigate = useNavigate()
  const search = searchParams.get('q') ?? ''
  const page = Number(searchParams.get('page') ?? '1') || 1
  const filter = useMemo(
    () => ({ page, pageSize: 50, search, sortBy: 'name', sortDir: 'asc' }),
    [page, search],
  )
  const query = useZones(filter)
  const create = useCreateZone()
  const rows = query.data?.data ?? []
  const selectedIds = useSelectionStore(selectedIdsFor('zone'))
  const toggleSelection = useSelectionStore((state) => state.toggle)
  const clearSelection = useSelectionStore((state) => state.clear)
  const updateSearch = (value: string) => setSearchParams(value ? { q: value } : {})
  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextPage === 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
  }

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
        <>
          <ZoneBulkActions ids={selectedIds} onDone={() => clearSelection('zone')} />
          <Table
            caption="Danh sách giáo họ"
            rows={rows}
            onRowActivate={(zone: any) => navigate(`/zones/${zone.id}`)}
            onRowDelete={(zone: any) => navigate(`/zones/${zone.id}?remove=1`)}
            onRowContextMenu={(zone: any, x: number, y: number) => setContextMenu({ zone, x, y })}
            columns={[
              {
                key: 'selected',
                label: 'Chọn',
                render: (zone: any) => (
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${zone.name}`}
                    checked={selectedIds.includes(zone.id)}
                    onChange={() => toggleSelection('zone', zone.id)}
                  />
                ),
              },
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
          <Pagination
            page={page}
            pageSize={50}
            total={query.data?.meta?.total ?? 0}
            onPageChange={setPage}
          />
          {contextMenu && (
            <RowContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
              items={[
                { label: 'Xem chi tiết', onClick: () => navigate(`/zones/${contextMenu.zone.id}`) },
                { label: 'Sửa', onClick: () => navigate(`/zones/${contextMenu.zone.id}?edit=1`) },
                {
                  label: 'Xóa',
                  danger: true,
                  onClick: () => navigate(`/zones/${contextMenu.zone.id}?remove=1`),
                },
              ]}
            />
          )}
        </>
      )}
      {isCreateOpen && (
        <Modal title="Thêm giáo họ" onClose={() => setCreateOpen(false)}>
          <ZoneForm
            submitLabel="Tạo giáo họ"
            isPending={create.isPending}
            onSubmit={async (input: any) => {
              await create.mutateAsync(input)
              setSearchParams({})
              setCreateOpen(false)
            }}
          />
        </Modal>
      )}
    </section>
  )
}
