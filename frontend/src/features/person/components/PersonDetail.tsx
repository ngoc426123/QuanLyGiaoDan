import { useEffect, useState } from 'react'
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
import { FamilyMemberForm } from '@/features/family-member/components/FamilyMemberForm.tsx'
import { useMoveFamilyMember } from '@/features/family-member/hooks/useFamilyMemberMutations.ts'
import {
  relationshipLabel,
  type Relationship,
} from '@/features/family-member/familyMember.types.ts'
import { AppClientError } from '@/shared/invoke.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { useRemovePerson, useUpdatePerson } from '../hooks/usePersonMutations.ts'
import { usePerson } from '../hooks/usePersons.ts'
import { PersonForm } from './PersonForm.tsx'
import styles from './Person.module.css'

const genderLabel = (value: string | null) =>
  value === 'male' ? 'Nam' : value === 'female' ? 'Nữ' : 'Chưa cập nhật'
export function PersonDetail({ id }: { id: string | undefined }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.add)
  const [isEditOpen, setEditOpen] = useState(params.get('edit') === '1')
  const [isRemoveOpen, setRemoveOpen] = useState(params.get('remove') === '1')
  const [isMoveOpen, setMoveOpen] = useState(params.get('move') === '1')
  const person = usePerson(id)
  const families = useFamilies({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
  const update = useUpdatePerson()
  const remove = useRemovePerson()
  const moveMember = useMoveFamilyMember()
  useEffect(() => {
    if (person.error instanceof AppClientError && person.error.code === 'NOT_FOUND') {
      addToast('Giáo dân này không còn tồn tại.', true)
      navigate('/persons', { replace: true })
    }
  }, [addToast, navigate, person.error])
  if (person.isLoading) return <Skeleton />
  if (person.isError) return <ErrorState error={person.error} onRetry={person.refetch} />
  const record = person.data
  if (!record)
    return <EmptyState title="Không tìm thấy giáo dân">Bản ghi này không còn tồn tại.</EmptyState>
  return (
    <section>
      <Link to="/persons">Về danh sách giáo dân</Link>
      <PageHeader title="Hồ sơ giáo dân" description={record.fullName}>
        <Button onClick={() => setEditOpen(true)}>Sửa</Button>
        <Button variant="danger" onClick={() => setRemoveOpen(true)}>
          Xoá
        </Button>
      </PageHeader>
      <dl className={styles.details}>
        <div>
          <dt>Tên thánh</dt>
          <dd>{record.holyName || 'Chưa cập nhật'}</dd>
        </div>
        <div>
          <dt>Giới tính</dt>
          <dd>{genderLabel(record.gender)}</dd>
        </div>
        <div>
          <dt>Ngày sinh</dt>
          <dd>{record.birthDate || 'Chưa cập nhật'}</dd>
        </div>
        <div>
          <dt>Số điện thoại</dt>
          <dd>{record.phone || 'Chưa cập nhật'}</dd>
        </div>
        <div>
          <dt>Ngày rửa tội</dt>
          <dd>{record.baptismDate || 'Chưa cập nhật'}</dd>
        </div>
        <div>
          <dt>Ngày rước lễ lần đầu</dt>
          <dd>{record.firstCommunionDate || 'Chưa cập nhật'}</dd>
        </div>
        <div>
          <dt>Ngày thêm sức</dt>
          <dd>{record.confirmationDate || 'Chưa cập nhật'}</dd>
        </div>
        <div>
          <dt>Ngày hôn phối</dt>
          <dd>{record.marriageDate || 'Chưa cập nhật'}</dd>
        </div>
        <div>
          <dt>Ngày qua đời</dt>
          <dd>{record.deathDate || 'Chưa cập nhật'}</dd>
        </div>
        <div>
          <dt>Ghi chú</dt>
          <dd>{record.note || 'Không có ghi chú'}</dd>
        </div>
      </dl>
      <section className={styles.section} aria-labelledby="membership-heading">
        <h2 id="membership-heading">Hộ hiện hành</h2>
        {record.currentMembership && <Button onClick={() => setMoveOpen(true)}>Chuyển hộ</Button>}
        {record.currentMembership ? (
          <Table
            caption="Hộ hiện hành"
            rows={[record.currentMembership]}
            columns={[
              {
                key: 'familyName',
                label: 'Gia đình',
                render: (member: any) => (
                  <Link to={`/families/${member.familyId}`}>{member.familyName}</Link>
                ),
              },
              {
                key: 'relationship',
                label: 'Quan hệ',
                render: (member: any) => relationshipLabel(member.relationship as Relationship),
              },
              { key: 'fromDate', label: 'Ngày vào hộ' },
            ]}
          />
        ) : (
          <EmptyState title="Chưa thuộc hộ nào">
            Có thể gán hộ khi tạo mới hoặc ở bước quản lý thành viên.
          </EmptyState>
        )}
      </section>
      <section className={styles.section} aria-labelledby="history-heading">
        <h2 id="history-heading">Lịch sử hộ</h2>
        {record.membershipHistory?.length ? (
          <Table
            caption="Lịch sử hộ"
            rows={record.membershipHistory}
            columns={[
              { key: 'familyName', label: 'Gia đình' },
              {
                key: 'relationship',
                label: 'Quan hệ',
                render: (member: any) => relationshipLabel(member.relationship as Relationship),
              },
              { key: 'fromDate', label: 'Từ ngày' },
              {
                key: 'toDate',
                label: 'Đến ngày',
                render: (member: any) => member.toDate || 'Hiện hành',
              },
            ]}
          />
        ) : (
          <EmptyState title="Chưa có lịch sử hộ">Chưa có lần gán hoặc chuyển hộ nào.</EmptyState>
        )}
      </section>
      {isEditOpen && (
        <Modal title="Sửa hồ sơ giáo dân" onClose={() => setEditOpen(false)}>
          <PersonForm
            initialValue={record}
            families={families.data?.data ?? []}
            submitLabel="Lưu thay đổi"
            isPending={update.isPending}
            onSubmit={async (patch: any) => {
              const result = await update.mutateAsync({
                id: record.id,
                expectedUpdatedAt: record.updatedAt,
                patch,
              })
              result.meta?.warnings?.forEach((warning: string) => addToast(warning))
              setEditOpen(false)
              return result
            }}
          />
        </Modal>
      )}
      {isRemoveOpen && (
        <ConfirmDialog
          title="Xoá giáo dân"
          isPending={remove.isPending}
          onClose={() => setRemoveOpen(false)}
          onConfirm={async () => {
            await remove.mutateAsync(record.id)
            navigate('/persons')
          }}
        >
          Bạn có chắc muốn xoá mềm hồ sơ giáo dân này?
        </ConfirmDialog>
      )}
      {isMoveOpen && record.currentMembership && (
        <Modal title="Chuyển hộ" onClose={() => setMoveOpen(false)}>
          <FamilyMemberForm
            mode="move"
            families={(families.data?.data ?? []).filter(
              (family: any) => family.id !== record.currentMembership.familyId,
            )}
            initialValue={{ relationship: record.currentMembership.relationship }}
            showHeadWarning={record.currentMembership.relationship === 'head'}
            isPending={moveMember.isPending}
            onSubmit={async (input: any) => {
              await moveMember.mutateAsync({ ...input, personId: record.id })
              setMoveOpen(false)
            }}
          />
        </Modal>
      )}
    </section>
  )
}
