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
import { useFamilies } from '@/features/family/hooks/useFamilies.ts'
import { useZones } from '@/features/zone/hooks/useZones.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { useCreatePerson } from '../hooks/usePersonMutations.ts'
import { usePersons } from '../hooks/usePersons.ts'
import { PersonForm } from './PersonForm.tsx'

export function PersonList() {
  const [params, setParams] = useSearchParams()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const search = params.get('q') ?? ''
  const zoneId = params.get('zoneId') ?? ''
  const familyId = params.get('familyId') ?? ''
  const gender = params.get('gender') ?? ''
  const isAlive = params.get('isAlive') ?? ''
  const page = Number(params.get('page') ?? '1') || 1
  const sortBy = params.get('sortBy') ?? 'givenName'
  const sortDir = params.get('sortDir') ?? 'asc'
  const filter = useMemo(
    () => ({
      page,
      pageSize: 50,
      search,
      zoneId: zoneId || undefined,
      familyId: familyId || undefined,
      gender: gender || undefined,
      isAlive: isAlive === '' ? undefined : isAlive === 'true',
      sortBy,
      sortDir,
    }),
    [page, search, zoneId, familyId, gender, isAlive, sortBy, sortDir],
  )
  const persons = usePersons(filter)
  const zones = useZones({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
  const families = useFamilies({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
  const create = useCreatePerson()
  const addToast = useToastStore((state) => state.add)
  const rows = persons.data?.data ?? []
  const updateFilters = (next: Record<string, string>) => {
    const result = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next))
      value ? result.set(key, value) : result.delete(key)
    if (!Object.hasOwn(next, 'page')) result.delete('page')
    setParams(result)
  }
  const clearFilters = () => setParams({})
  const hasFilters = Boolean(search || zoneId || familyId || gender || isAlive)
  return (
    <section>
      <PageHeader title="Giáo dân" description="Quản lý hồ sơ và tình trạng gia đình của giáo dân.">
        <Button onClick={() => setCreateOpen(true)}>Thêm giáo dân</Button>
      </PageHeader>
      <Input
        label="Tìm trong danh sách"
        value={search}
        onChange={(event: any) => updateFilters({ q: event.target.value })}
      />
      <Select
        label="Giáo họ"
        value={zoneId}
        onChange={(event: any) => updateFilters({ zoneId: event.target.value })}
      >
        <option value="">Tất cả giáo họ</option>
        {(zones.data?.data ?? []).map((zone: any) => (
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
        <option value="givenName:asc">Tên gọi A-Z</option>
        <option value="fullName:asc">Họ tên A-Z</option>
        <option value="birthDate:asc">Ngày sinh tăng dần</option>
        <option value="createdAt:desc">Mới tạo trước</option>
      </Select>
      <Select
        label="Gia đình"
        value={familyId}
        onChange={(event: any) => updateFilters({ familyId: event.target.value })}
      >
        <option value="">Tất cả gia đình</option>
        {(families.data?.data ?? []).map((family: any) => (
          <option key={family.id} value={family.id}>
            {family.name}
          </option>
        ))}
      </Select>
      <Select
        label="Giới tính"
        value={gender}
        onChange={(event: any) => updateFilters({ gender: event.target.value })}
      >
        <option value="">Tất cả</option>
        <option value="male">Nam</option>
        <option value="female">Nữ</option>
      </Select>
      <Select
        label="Tình trạng"
        value={isAlive}
        onChange={(event: any) => updateFilters({ isAlive: event.target.value })}
      >
        <option value="">Tất cả</option>
        <option value="true">Còn sống</option>
        <option value="false">Đã qua đời</option>
      </Select>
      {(persons.isLoading || zones.isLoading || families.isLoading) && <Skeleton />}
      {persons.isError && <ErrorState error={persons.error} onRetry={persons.refetch} />}
      {!persons.isLoading && !persons.isError && rows.length === 0 && !hasFilters && (
        <EmptyState
          title="Chưa có giáo dân"
          actionLabel="Thêm giáo dân"
          onAction={() => setCreateOpen(true)}
        >
          Hãy thêm hồ sơ giáo dân đầu tiên.
        </EmptyState>
      )}
      {!persons.isLoading && !persons.isError && rows.length === 0 && hasFilters && (
        <EmptyState
          title="Không có kết quả khớp bộ lọc"
          actionLabel="Xoá bộ lọc"
          onAction={clearFilters}
        >
          Hãy thử điều kiện khác.
        </EmptyState>
      )}
      {rows.length > 0 && (
        <>
          <Table
            caption="Danh sách giáo dân"
            rows={rows}
            columns={[
              {
                key: 'fullName',
                label: 'Họ tên',
                render: (person: any) => (
                  <Link to={`/persons/${person.id}`}>{person.fullName}</Link>
                ),
              },
              {
                key: 'holyName',
                label: 'Tên thánh',
                render: (person: any) => person.holyName || 'Chưa cập nhật',
              },
              {
                key: 'gender',
                label: 'Giới tính',
                render: (person: any) =>
                  person.gender === 'male'
                    ? 'Nam'
                    : person.gender === 'female'
                      ? 'Nữ'
                      : 'Chưa cập nhật',
              },
              {
                key: 'birthDate',
                label: 'Ngày sinh',
                render: (person: any) => person.birthDate || 'Chưa cập nhật',
              },
              {
                key: 'familyName',
                label: 'Hộ',
                render: (person: any) => person.familyName || 'Chưa gán hộ',
              },
              {
                key: 'zoneName',
                label: 'Giáo họ',
                render: (person: any) => person.zoneName || 'Chưa gán hộ',
              },
            ]}
          />
          <Pagination
            page={page}
            pageSize={50}
            total={persons.data?.meta?.total ?? 0}
            onPageChange={(nextPage) => updateFilters({ page: String(nextPage) })}
          />
        </>
      )}
      {isCreateOpen && (
        <Modal title="Thêm giáo dân" onClose={() => setCreateOpen(false)}>
          <PersonForm
            families={families.data?.data ?? []}
            allowFamilyAssignment
            submitLabel="Tạo giáo dân"
            isPending={create.isPending}
            onSubmit={async (input: any) => {
              const result = await create.mutateAsync(input)
              result.meta?.warnings?.forEach((warning: string) => addToast(warning))
              setCreateOpen(false)
              return result
            }}
          />
        </Modal>
      )}
    </section>
  )
}
