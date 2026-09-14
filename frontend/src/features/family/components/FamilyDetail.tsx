import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useZones } from '@/features/zone/hooks/useZones.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { AppClientError } from '@/shared/invoke.ts'
import { useRemoveFamily, useUpdateFamily } from '../hooks/useFamilyMutations.ts'
import { useFamily } from '../hooks/useFamilies.ts'
import { FamilyForm } from './FamilyForm.tsx'
import styles from './Family.module.css'

const relationships = {
  head: 'Chủ hộ',
  spouse: 'Vợ/chồng',
  child: 'Con',
  parent: 'Cha/mẹ',
  other: 'Khác',
}

export function FamilyDetail({ id }: { id: string | undefined }) {
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.add)
  const [isEditOpen, setEditOpen] = useState(false)
  const [isRemoveOpen, setRemoveOpen] = useState(false)
  const [removeError, setRemoveError] = useState<any>(null)
  const family = useFamily(id)
  const zones = useZones({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
  const update = useUpdateFamily()
  const remove = useRemoveFamily()
  useEffect(() => {
    if (!(family.error instanceof AppClientError) || family.error.code !== 'NOT_FOUND') return
    addToast('Hộ gia đình này không còn tồn tại.', true)
    navigate('/families', { replace: true })
  }, [addToast, family.error, navigate])
  if (family.isLoading) return <Skeleton />
  if (family.isError) return <ErrorState error={family.error} onRetry={family.refetch} />
  const record = family.data
  if (!record)
    return (
      <EmptyState title="Không tìm thấy hộ gia đình">Bản ghi này không còn tồn tại.</EmptyState>
    )
  const members = [...(record.members ?? [])].sort(
    (left: any, right: any) =>
      Number(right.relationship === 'head') - Number(left.relationship === 'head'),
  )
  const hasHead = members.some((member: any) => member.relationship === 'head')

  return (
    <section>
      <Link to="/families">Về danh sách gia đình</Link>
      <PageHeader title="Chi tiết hộ" description={`${record.name} · ${record.zoneName}`}>
        <Button onClick={() => setEditOpen(true)}>Sửa</Button>
        <Button variant="danger" onClick={() => setRemoveOpen(true)}>
          Xoá
        </Button>
      </PageHeader>
      <dl className={styles.details}>
        <div>
          <dt>Giáo họ</dt>
          <dd>{record.zoneName}</dd>
        </div>
        <div>
          <dt>Địa chỉ</dt>
          <dd>{record.address || 'Chưa cập nhật'}</dd>
        </div>
        <div>
          <dt>Ghi chú</dt>
          <dd>{record.note || 'Không có ghi chú'}</dd>
        </div>
      </dl>
      <section className={styles.section} aria-labelledby="members-heading">
        <h2 id="members-heading">Thành viên hiện hành</h2>
        {!hasHead && <p className={styles.warning}>Hộ này chưa có chủ hộ.</p>}
        {members.length === 0 ? (
          <EmptyState title="Chưa có thành viên">
            Thành viên sẽ được thêm ở bước tiếp theo.
          </EmptyState>
        ) : (
          <Table
            caption="Danh sách thành viên hiện hành"
            rows={members}
            columns={[
              {
                key: 'personFullName',
                label: 'Họ tên',
                render: (member: any) => (
                  <Link to={`/persons/${member.personId}`}>{member.personFullName}</Link>
                ),
              },
              {
                key: 'personHolyName',
                label: 'Tên thánh',
                render: (member: any) => member.personHolyName || 'Chưa cập nhật',
              },
              {
                key: 'relationship',
                label: 'Quan hệ',
                render: (member: any) =>
                  member.relationship === 'head' ? (
                    <strong>{relationships.head}</strong>
                  ) : (
                    relationships[member.relationship] || member.relationship
                  ),
              },
              {
                key: 'personBirthDate',
                label: 'Ngày sinh',
                render: (member: any) => member.personBirthDate || 'Chưa cập nhật',
              },
              { key: 'fromDate', label: 'Ngày vào hộ' },
            ]}
          />
        )}
      </section>
      {isEditOpen && (
        <Modal title="Sửa gia đình" onClose={() => setEditOpen(false)}>
          <FamilyForm
            initialValue={record}
            zones={zones.data?.data ?? []}
            submitLabel="Lưu thay đổi"
            isPending={update.isPending}
            onSubmit={async (patch: any) => {
              await update.mutateAsync({
                id: record.id,
                expectedUpdatedAt: record.updatedAt,
                patch,
              })
              setEditOpen(false)
            }}
          />
        </Modal>
      )}
      {isRemoveOpen && (
        <ConfirmDialog
          title="Xoá gia đình"
          isPending={remove.isPending}
          onClose={() => setRemoveOpen(false)}
          onConfirm={async () => {
            setRemoveError(null)
            try {
              await remove.mutateAsync(record.id)
              navigate('/families')
            } catch (error) {
              setRemoveError(error)
            }
          }}
        >
          {removeError?.code === 'CONFLICT'
            ? `Gia đình còn ${removeError.details?.memberCount ?? ''} thành viên, hãy chuyển những người này sang hộ khác trước.`
            : 'Bạn có chắc muốn xoá mềm gia đình này?'}
        </ConfirmDialog>
      )}
    </section>
  )
}
