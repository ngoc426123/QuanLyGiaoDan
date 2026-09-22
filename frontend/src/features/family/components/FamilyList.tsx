import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Pagination } from '@/components/ui/Pagination.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useZones } from '@/features/zone/hooks/useZones.ts'
import { useCreateFamily } from '../hooks/useFamilyMutations.ts'
import { useFamilies } from '../hooks/useFamilies.ts'
import { FamilyForm } from './FamilyForm.tsx'
import { FamilyBulkActions } from './FamilyBulkActions.tsx'
import { selectedIdsFor, useSelectionStore } from '@/stores/selection.store.ts'
import { RowContextMenu } from '@/components/ui/RowContextMenu.tsx'
import styles from '@/components/layout/DirectoryWorkspace.module.css'
import { useComposedSearch } from '@/hooks/useComposedSearch.ts'

export function FamilyList() {
  const location = useLocation()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<any>(null)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [zoneId, setZoneId] = useState(location.state?.filters?.zoneId ?? '')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const requestedZoneId = location.state?.filters?.zoneId
  const filter = useMemo(
    () => ({
      page,
      pageSize: 50,
      search,
      zoneId: zoneId || undefined,
      sortBy,
      sortDir,
    }),
    [page, search, sortBy, sortDir, zoneId],
  )
  const families = useFamilies(filter)
  const zones = useZones({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
  const create = useCreateFamily()
  const selectedIds = useSelectionStore(selectedIdsFor('family'))
  const toggleSelection = useSelectionStore((state) => state.toggle)
  const clearSelection = useSelectionStore((state) => state.clear)
  const rows = families.data?.data ?? []
  const zoneRows = zones.data?.data ?? []
  const clearFilters = () => {
    setSearch('')
    setZoneId('')
    setSortBy('name')
    setSortDir('asc')
    setPage(1)
  }
  const familySearch = useComposedSearch(search, (nextSearch) => {
    setSearch(nextSearch)
    setPage(1)
  })
  useEffect(() => {
    if (typeof requestedZoneId !== 'string') return
    setZoneId(requestedZoneId)
    setPage(1)
  }, [requestedZoneId])

  return (
    <section className={styles.page}>
      <PageHeader title="Gia đình" description="Quản lý hộ gia đình và giáo họ trực thuộc.">
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={zones.isLoading || zoneRows.length === 0}
        >
          Thêm gia đình
        </Button>
      </PageHeader>
      <div className={styles.filters}>
        <Input label="Tìm hộ" {...familySearch} />
        <Select
          label="Lọc theo giáo họ"
          value={zoneId}
          onChange={(event: any) => {
            setZoneId(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả giáo họ</option>
          {zoneRows.map((zone: any) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </Select>
        <Select
          label="Sắp xếp"
          value={`${sortBy}:${sortDir}`}
          onChange={(event: any) => {
            const [nextSortBy, nextSortDir] = event.target.value.split(':')
            setSortBy(nextSortBy)
            setSortDir(nextSortDir)
            setPage(1)
          }}
        >
          <option value="name:asc">Tên hộ A-Z</option>
          <option value="name:desc">Tên hộ Z-A</option>
          <option value="createdAt:desc">Mới tạo trước</option>
        </Select>
      </div>
      {(families.isLoading || zones.isLoading) && <Skeleton />}
      {families.isError && <ErrorState error={families.error} onRetry={families.refetch} />}
      {zones.isError && <ErrorState error={zones.error} onRetry={zones.refetch} />}
      {!families.isLoading &&
        !zones.isLoading &&
        !families.isError &&
        !zones.isError &&
        zoneRows.length === 0 && (
          <EmptyState title="Cần tạo giáo họ trước">
            Hãy tạo giáo họ trước khi thêm hộ gia đình.
          </EmptyState>
        )}
      {!families.isLoading &&
        !families.isError &&
        zoneRows.length > 0 &&
        rows.length === 0 &&
        !search &&
        !zoneId && (
          <EmptyState
            title="Chưa có gia đình"
            actionLabel="Thêm gia đình"
            onAction={() => setCreateOpen(true)}
          >
            Hãy thêm hộ gia đình đầu tiên vào giáo họ.
          </EmptyState>
        )}
      {!families.isLoading &&
        !families.isError &&
        zoneRows.length > 0 &&
        rows.length === 0 &&
        (search || zoneId) && (
          <EmptyState
            title="Không có kết quả khớp bộ lọc"
            actionLabel="Xoá bộ lọc"
            onAction={clearFilters}
          >
            Hãy thử từ khoá hoặc giáo họ khác.
          </EmptyState>
        )}
      {rows.length > 0 && (
        <>
          <FamilyBulkActions
            ids={selectedIds}
            zones={zoneRows}
            onDone={() => clearSelection('family')}
          />
          <Table
            caption="Danh sách gia đình"
            rows={rows}
            onRowActivate={(family: any) => navigate(`/families/${family.id}`)}
            onRowDelete={(family: any) =>
              navigate(`/families/${family.id}`, { state: { action: 'remove' } })
            }
            onRowContextMenu={(family: any, x: number, y: number) =>
              setContextMenu({ family, x, y })
            }
            columns={[
              {
                key: 'selected',
                label: 'Chọn',
                render: (family: any) => (
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${family.name}`}
                    checked={selectedIds.includes(family.id)}
                    onChange={() => toggleSelection('family', family.id)}
                  />
                ),
              },
              {
                key: 'name',
                label: 'Tên hộ',
                render: (family: any) => <Link to={`/families/${family.id}`}>{family.name}</Link>,
              },
              { key: 'zoneName', label: 'Giáo họ' },
              {
                key: 'address',
                label: 'Địa chỉ',
                render: (family: any) => family.address || 'Chưa cập nhật',
              },
              { key: 'memberCount', label: 'Số thành viên' },
            ]}
          />
          <Pagination
            page={page}
            pageSize={50}
            total={families.data?.meta?.total ?? 0}
            onPageChange={setPage}
          />
          {contextMenu && (
            <RowContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
              items={[
                {
                  label: 'Xem chi tiết',
                  onClick: () => navigate(`/families/${contextMenu.family.id}`),
                },
                {
                  label: 'Sửa',
                  onClick: () =>
                    navigate(`/families/${contextMenu.family.id}`, { state: { action: 'edit' } }),
                },
                {
                  label: 'Xóa',
                  danger: true,
                  onClick: () =>
                    navigate(`/families/${contextMenu.family.id}`, { state: { action: 'remove' } }),
                },
              ]}
            />
          )}
        </>
      )}
      {isCreateOpen && (
        <Modal title="Thêm gia đình" onClose={() => setCreateOpen(false)}>
          <FamilyForm
            zones={zoneRows}
            submitLabel="Tạo gia đình"
            isPending={create.isPending}
            onSubmit={async (input: any) => {
              await create.mutateAsync(input)
              clearFilters()
              setCreateOpen(false)
            }}
          />
        </Modal>
      )}
    </section>
  )
}
