import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useFamilies } from '@/features/family/hooks/useFamilies.ts'
import { useRemoveZone, useUpdateZone } from '../hooks/useZoneMutations.ts'
import { useZone } from '../hooks/useZones.ts'
import { ZoneForm } from './ZoneForm.tsx'
import styles from './Zone.module.css'

export function ZoneDetail({ id }: { id: string | undefined }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [isEditOpen, setEditOpen] = useState(params.get('edit') === '1')
  const [isRemoveOpen, setRemoveOpen] = useState(params.get('remove') === '1')
  const [removeError, setRemoveError] = useState<any>(null)
  const query = useZone(id)
  const families = useFamilies({
    page: 1,
    pageSize: 50,
    zoneId: id,
    sortBy: 'name',
    sortDir: 'asc',
  })
  const update = useUpdateZone()
  const remove = useRemoveZone()
  if (query.isLoading) return <Skeleton />
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />
  const zone = query.data
  if (!zone)
    return <EmptyState title="Không tìm thấy giáo họ">Bản ghi này không còn tồn tại.</EmptyState>

  return (
    <section>
      <Link to="/zones">Về danh sách giáo họ</Link>
      <PageHeader
        title="Chi tiết giáo họ"
        description={zone.holyName ? `${zone.name} · Bổn mạng: ${zone.holyName}` : zone.name}
      >
        <Button onClick={() => setEditOpen(true)}>Sửa</Button>
        <Button variant="danger" onClick={() => setRemoveOpen(true)}>
          Xoá
        </Button>
      </PageHeader>
      <dl className={styles.details}>
        <div>
          <dt>Số gia đình</dt>
          <dd>{zone.familyCount}</dd>
        </div>
        <div>
          <dt>Số giáo dân</dt>
          <dd>{zone.personCount}</dd>
        </div>
        <div>
          <dt>Ghi chú</dt>
          <dd>{zone.note || 'Không có ghi chú'}</dd>
        </div>
      </dl>
      <section className={styles.section} aria-labelledby="families-heading">
        <h2 id="families-heading">Gia đình thuộc giáo họ</h2>
        {families.isLoading && <Skeleton />}
        {families.isError && <ErrorState error={families.error} onRetry={families.refetch} />}
        {!families.isLoading && !families.isError && (families.data?.data ?? []).length === 0 && (
          <EmptyState title="Chưa có gia đình">
            Thêm gia đình vào giáo họ này để bắt đầu.
          </EmptyState>
        )}
        {(families.data?.data ?? []).length > 0 && (
          <Table
            caption="Danh sách gia đình"
            rows={families.data.data}
            columns={[
              {
                key: 'name',
                label: 'Tên hộ',
                render: (family: any) => <Link to={`/families/${family.id}`}>{family.name}</Link>,
              },
              {
                key: 'address',
                label: 'Địa chỉ',
                render: (family: any) => family.address || 'Chưa cập nhật',
              },
              { key: 'memberCount', label: 'Số thành viên' },
            ]}
          />
        )}
      </section>
      {isEditOpen && (
        <Modal title="Sửa giáo họ" onClose={() => setEditOpen(false)}>
          <ZoneForm
            initialValue={zone}
            submitLabel="Lưu thay đổi"
            isPending={update.isPending}
            onSubmit={async (patch: any) => {
              await update.mutateAsync({ id: zone.id, expectedUpdatedAt: zone.updatedAt, patch })
              setEditOpen(false)
            }}
          />
        </Modal>
      )}
      {isRemoveOpen && (
        <ConfirmDialog
          title="Xoá giáo họ"
          isPending={remove.isPending}
          onClose={() => setRemoveOpen(false)}
          onConfirm={async () => {
            setRemoveError(null)
            try {
              await remove.mutateAsync(zone.id)
              navigate('/zones')
            } catch (error) {
              setRemoveError(error)
            }
          }}
        >
          {removeError?.code === 'FOREIGN_KEY_VIOLATION'
            ? `Giáo họ còn ${removeError.details?.familyCount ?? ''} gia đình, hãy chuyển sang giáo họ khác trước.`
            : 'Bạn có chắc muốn xoá mềm giáo họ này?'}
        </ConfirmDialog>
      )}
    </section>
  )
}
