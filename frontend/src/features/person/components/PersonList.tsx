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
import { useFamilies } from '@/features/family/hooks/useFamilies.ts'
import { useZones } from '@/features/zone/hooks/useZones.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { useCreatePerson } from '../hooks/usePersonMutations.ts'
import { usePersons } from '../hooks/usePersons.ts'
import { useCsvExport } from '@/features/report/hooks/useCsvExport.ts'
import { PersonForm } from './PersonForm.tsx'
import { PersonBulkActions } from './PersonBulkActions.tsx'
import { selectedIdsFor, useSelectionStore } from '@/stores/selection.store.ts'
import { RowContextMenu } from '@/components/ui/RowContextMenu.tsx'
import styles from '@/components/layout/DirectoryWorkspace.module.css'
import { useComposedSearch } from '@/hooks/useComposedSearch.ts'

export function PersonList() {
  const location = useLocation()
  const [isCreateOpen, setCreateOpen] = useState(location.state?.action === 'new')
  const [contextMenu, setContextMenu] = useState<any>(null)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [gender, setGender] = useState('')
  const [isAlive, setIsAlive] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('givenName')
  const [sortDir, setSortDir] = useState('asc')
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
  const exportCsv = useCsvExport()
  const addToast = useToastStore((state) => state.add)
  const selectedIds = useSelectionStore(selectedIdsFor('person'))
  const toggleSelection = useSelectionStore((state) => state.toggle)
  const clearSelection = useSelectionStore((state) => state.clear)
  const rows = persons.data?.data ?? []
  const clearFilters = () => {
    setSearch('')
    setZoneId('')
    setFamilyId('')
    setGender('')
    setIsAlive('')
    setSortBy('givenName')
    setSortDir('asc')
    setPage(1)
  }
  const personSearch = useComposedSearch(search, (nextSearch) => {
    setSearch(nextSearch)
    setPage(1)
  })
  useEffect(() => {
    if (location.state?.action === 'new') setCreateOpen(true)
  }, [location.state?.action])
  const hasFilters = Boolean(search || zoneId || familyId || gender || isAlive)
  return (
    <section className={styles.page}>
      <PageHeader title="Giáo dân" description="Quản lý hồ sơ và tình trạng gia đình của giáo dân.">
        <Button
          variant="secondary"
          disabled={exportCsv.isPending || rows.length === 0}
          onClick={() =>
            exportCsv.mutate({
              report: 'persons',
              filter: {
                search,
                zoneId: zoneId || undefined,
                familyId: familyId || undefined,
                gender: gender || undefined,
                isAlive: isAlive === '' ? undefined : isAlive === 'true',
              },
            })
          }
        >
          Xuất CSV
        </Button>
        <Button onClick={() => setCreateOpen(true)}>Thêm giáo dân</Button>
      </PageHeader>
      <div className={styles.filters}>
        <Input label="Tìm trong danh sách" {...personSearch} />
        <Select
          label="Giáo họ"
          value={zoneId}
          onChange={(event: any) => {
            setZoneId(event.target.value)
            setPage(1)
          }}
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
            setSortBy(nextSortBy)
            setSortDir(nextSortDir)
            setPage(1)
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
          onChange={(event: any) => {
            setFamilyId(event.target.value)
            setPage(1)
          }}
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
          onChange={(event: any) => {
            setGender(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </Select>
        <Select
          label="Tình trạng"
          value={isAlive}
          onChange={(event: any) => {
            setIsAlive(event.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả</option>
          <option value="true">Còn sống</option>
          <option value="false">Đã qua đời</option>
        </Select>
      </div>
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
          <PersonBulkActions
            ids={selectedIds}
            families={families.data?.data ?? []}
            onDone={() => clearSelection('person')}
          />
          <Table
            caption="Danh sách giáo dân"
            rows={rows}
            onRowActivate={(person: any) => navigate(`/persons/${person.id}`)}
            onRowDelete={(person: any) =>
              navigate(`/persons/${person.id}`, { state: { action: 'remove' } })
            }
            onRowContextMenu={(person: any, x: number, y: number) =>
              setContextMenu({ person, x, y })
            }
            columns={[
              {
                key: 'selected',
                label: 'Chọn',
                render: (person: any) => (
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${person.fullName}`}
                    checked={selectedIds.includes(person.id)}
                    onChange={() => toggleSelection('person', person.id)}
                  />
                ),
              },
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
                  onClick: () => navigate(`/persons/${contextMenu.person.id}`),
                },
                {
                  label: 'Sửa',
                  onClick: () =>
                    navigate(`/persons/${contextMenu.person.id}`, { state: { action: 'edit' } }),
                },
                {
                  label: 'Chuyển hộ',
                  onClick: () =>
                    navigate(`/persons/${contextMenu.person.id}`, { state: { action: 'move' } }),
                },
                {
                  label: 'Xóa',
                  danger: true,
                  onClick: () =>
                    navigate(`/persons/${contextMenu.person.id}`, { state: { action: 'remove' } }),
                },
              ]}
            />
          )}
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
              clearFilters()
              setCreateOpen(false)
              return result
            }}
          />
        </Modal>
      )}
    </section>
  )
}
