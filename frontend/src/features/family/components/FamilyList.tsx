import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

export function FamilyList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const search = searchParams.get('q') ?? ''
  const zoneId = searchParams.get('zoneId') ?? ''
  const page = Number(searchParams.get('page') ?? '1') || 1
  const sortBy = searchParams.get('sortBy') ?? 'name'
  const sortDir = searchParams.get('sortDir') ?? 'asc'
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
  const rows = families.data?.data ?? []
  const zoneRows = zones.data?.data ?? []
  const updateFilters = (next: {
    search?: string
    zoneId?: string
    sortBy?: string
    sortDir?: string
    page?: string
  }) => {
    const params = new URLSearchParams(searchParams)
    const nextSearch = next.search ?? search
    const nextZoneId = next.zoneId ?? zoneId
    if (nextSearch) params.set('q', nextSearch)
    else params.delete('q')
    if (nextZoneId) params.set('zoneId', nextZoneId)
    else params.delete('zoneId')
    for (const [key, value] of Object.entries(next))
      if (!['search', 'zoneId'].includes(key)) value ? params.set(key, value) : params.delete(key)
    if (!Object.hasOwn(next, 'page')) params.delete('page')
    setSearchParams(params)
  }
  const clearFilters = () => setSearchParams({})

  return (
    <section>
      <PageHeader title="Gia đình" description="Quản lý hộ gia đình và giáo họ trực thuộc.">
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={zones.isLoading || zoneRows.length === 0}
        >
          Thêm gia đình
        </Button>
      </PageHeader>
      <Input
        label="Tìm hộ"
        value={search}
        onChange={(event: any) => updateFilters({ search: event.target.value })}
      />
      <Select
        label="Lọc theo giáo họ"
        value={zoneId}
        onChange={(event: any) => updateFilters({ zoneId: event.target.value })}
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
          updateFilters({ sortBy: nextSortBy, sortDir: nextSortDir })
        }}
      >
        <option value="name:asc">Tên hộ A-Z</option>
        <option value="name:desc">Tên hộ Z-A</option>
        <option value="createdAt:desc">Mới tạo trước</option>
      </Select>
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
          <Table
            caption="Danh sách gia đình"
            rows={rows}
            columns={[
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
            onPageChange={(nextPage) => updateFilters({ page: String(nextPage) })}
          />
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
              setSearchParams({})
              setCreateOpen(false)
            }}
          />
        </Modal>
      )}
    </section>
  )
}
