import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Pagination } from '@/components/ui/Pagination.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useFamilies } from '@/features/family/hooks/useFamilies.ts'
import { useZones } from '@/features/zone/hooks/useZones.ts'
import { usePersons } from '../hooks/usePersons.ts'
import { PersonBulkActions } from './PersonBulkActions.tsx'
import { selectedIdsFor, useSelectionStore } from '@/stores/selection.store.ts'
import { RowContextMenu } from '@/components/ui/RowContextMenu.tsx'
import styles from '@/components/layout/DirectoryWorkspace.module.css'
import { useComposedSearch } from '@/hooks/useComposedSearch.ts'
import { personName } from '../personName.ts'

export function PersonList() {
  const [contextMenu, setContextMenu] = useState<any>(null)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const personType = searchParams.get('type') === 'external' ? 'external' : 'parish'
  const isExternal = personType === 'external'
  const [search, setSearch] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [gender, setGender] = useState('')
  const [isAlive, setIsAlive] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const filter = useMemo(
    () => ({
      page,
      pageSize: 50,
      search,
      zoneId: zoneId || undefined,
      familyId: familyId || undefined,
      gender: gender || undefined,
      isAlive: isAlive === '' ? undefined : isAlive === 'true',
      personType,
      sortBy,
      sortDir,
    }),
    [page, search, zoneId, familyId, gender, isAlive, personType, sortBy, sortDir],
  )
  const persons = usePersons(filter)
  const zones = useZones({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
  const families = useFamilies({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
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
    setSortBy('createdAt')
    setSortDir('desc')
    setPage(1)
  }
  const selectType = (nextType: 'parish' | 'external') => {
    setSearchParams(nextType === 'external' ? { type: 'external' } : {})
    clearSelection('person')
    clearFilters()
  }
  const personSearch = useComposedSearch(search, (nextSearch) => {
    setSearch(nextSearch)
    setPage(1)
  })
  const hasFilters = Boolean(search || zoneId || familyId || gender || isAlive)
  const personLabel = isExternal ? 'người ngoài xứ' : 'giáo dân'
  return (
    <section className={styles.page}>
      <PageHeader
        title="Danh bạ"
        description="Quản lý giáo dân trong xứ và người ngoài xứ dùng chung."
      >
        <Button onClick={() => navigate(isExternal ? '/persons/external/new' : '/persons/new')}>
          Thêm {isExternal ? 'người ngoài xứ' : 'giáo dân'}
        </Button>
      </PageHeader>
      <div className={styles.tabs} role="tablist" aria-label="Loại hồ sơ">
        <button
          type="button"
          role="tab"
          aria-selected={!isExternal}
          className={!isExternal ? styles.tabActive : undefined}
          onClick={() => selectType('parish')}
        >
          Trong xứ
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isExternal}
          className={isExternal ? styles.tabActive : undefined}
          onClick={() => selectType('external')}
        >
          Ngoài xứ
        </button>
      </div>
      <div className={styles.filters}>
        <Input label="Tìm trong danh sách" {...personSearch} />
        {!isExternal && (
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
        )}
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
        {!isExternal && (
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
        )}
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
          title={`Chưa có ${personLabel}`}
          actionLabel={`Thêm ${personLabel}`}
          onAction={() => navigate(isExternal ? '/persons/external/new' : '/persons/new')}
        >
          Hãy thêm hồ sơ đầu tiên.
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
          {!isExternal && (
            <PersonBulkActions
              ids={selectedIds}
              families={families.data?.data ?? []}
              onDone={() => clearSelection('person')}
            />
          )}
          <Table
            caption={`Danh sách ${personLabel}`}
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
                    aria-label={`Chọn ${personName(person)}`}
                    checked={selectedIds.includes(person.id)}
                    onChange={() => toggleSelection('person', person.id)}
                  />
                ),
              },
              {
                key: 'fullName',
                label: 'Họ tên',
                render: (person: any) => (
                  <Link to={`/persons/${person.id}`}>{personName(person)}</Link>
                ),
              },
              {
                key: 'holyName',
                label: 'Tên thánh',
                render: (person: any) => person.holyName || 'Chưa cập nhật',
              },
              ...(!isExternal
                ? [
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
                  ]
                : [
                    {
                      key: 'phone',
                      label: 'Số điện thoại',
                      render: (person: any) => person.phone || 'Chưa cập nhật',
                    },
                    {
                      key: 'parishName',
                      label: 'Giáo xứ',
                      render: (person: any) => person.parishName || 'Chưa cập nhật',
                    },
                  ]),
              {
                key: 'birthDate',
                label: 'Ngày sinh',
                render: (person: any) => person.birthDate || 'Chưa cập nhật',
              },
              ...(!isExternal
                ? [
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
                  ]
                : []),
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
                  onClick: () => navigate(`/persons/${contextMenu.person.id}/edit`),
                },
                ...(!isExternal
                  ? [
                      {
                        label: 'Chuyển hộ',
                        onClick: () =>
                          navigate(`/persons/${contextMenu.person.id}`, {
                            state: { action: 'move' },
                          }),
                      },
                    ]
                  : []),
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
    </section>
  )
}
