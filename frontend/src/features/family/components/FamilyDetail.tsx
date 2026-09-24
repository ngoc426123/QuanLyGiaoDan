import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { ActivityLog } from '@/features/activity-log/components/ActivityLog.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useFamilies } from '@/features/family/hooks/useFamilies.ts'
import { FamilyMemberForm } from '@/features/family-member/components/FamilyMemberForm.tsx'
import {
  useAddFamilyMember,
  useMoveFamilyMember,
  useRemoveFamilyMember,
  useUpdateFamilyMember,
} from '@/features/family-member/hooks/useFamilyMemberMutations.ts'
import {
  relationshipLabel,
  relationshipOptions,
  type FamilyMember,
  type Relationship,
} from '@/features/family-member/familyMember.types.ts'
import { usePersons } from '@/features/person/hooks/usePersons.ts'
import { useZones } from '@/features/zone/hooks/useZones.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { AppClientError } from '@/shared/invoke.ts'
import { useRemoveFamily, useUpdateFamily } from '../hooks/useFamilyMutations.ts'
import { useFamily } from '../hooks/useFamilies.ts'
import { FamilyForm } from './FamilyForm.tsx'
import styles from './Family.module.css'

const listOptions = { page: 1, pageSize: 200, sortBy: 'name', sortDir: 'asc' } as const

export function FamilyDetail({ id }: { id: string | undefined }) {
  const location = useLocation()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.add)
  const [isEditOpen, setEditOpen] = useState(location.state?.action === 'edit')
  const [isRemoveOpen, setRemoveOpen] = useState(location.state?.action === 'remove')
  const [isAddOpen, setAddOpen] = useState(false)
  const [personSearch, setPersonSearch] = useState('')
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null)
  const [memberToMove, setMemberToMove] = useState<FamilyMember | null>(null)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<AppClientError | null>(null)
  const family = useFamily(id)
  const zones = useZones(listOptions)
  const families = useFamilies(listOptions)
  const people = usePersons(
    {
      page: 1,
      pageSize: 200,
      search: personSearch.trim() || undefined,
      withoutFamily: true,
      sortBy: 'givenName',
      sortDir: 'asc',
    },
    isAddOpen && Boolean(personSearch.trim()),
  )
  const update = useUpdateFamily()
  const remove = useRemoveFamily()
  const addMember = useAddFamilyMember()
  const updateMember = useUpdateFamilyMember()
  const moveMember = useMoveFamilyMember()
  const removeMember = useRemoveFamilyMember()

  useEffect(() => {
    if (family.error instanceof AppClientError && family.error.code === 'NOT_FOUND') {
      addToast('Hộ gia đình này không còn tồn tại.', true)
      navigate('/families', { replace: true })
    }
  }, [addToast, family.error, navigate])
  if (family.isLoading) return <Skeleton />
  if (family.isError) return <ErrorState error={family.error} onRetry={family.refetch} />
  const record = family.data
  if (!record)
    return (
      <EmptyState title="Không tìm thấy hộ gia đình">Bản ghi này không còn tồn tại.</EmptyState>
    )
  const members = [...((record.members as FamilyMember[] | undefined) ?? [])].sort(
    (left, right) => Number(right.relationship === 'head') - Number(left.relationship === 'head'),
  )
  const history = (record.membershipHistory as FamilyMember[] | undefined) ?? []
  const hasHead = members.some((member) => member.relationship === 'head')
  const availablePeople = (people.data?.data ?? []).filter(
    (person: { familyId?: string | null }) => !person.familyId,
  )
  const destinations = (families.data?.data ?? []).filter(
    (item: { id: string }) => item.id !== record.id,
  )
  const reportMemberError = (error: unknown) =>
    setMemberError(
      error instanceof AppClientError ? error.message : 'Không thể cập nhật thành viên.',
    )

  return (
    <section>
      <Link to="/families">Về danh sách gia đình</Link>
      <PageHeader title="Chi tiết hộ" description={`${record.name} · ${record.zoneName}`}>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          Thêm thành viên
        </Button>
        <Button onClick={() => setEditOpen(true)}>Sửa</Button>
        <Button variant="danger" onClick={() => setRemoveOpen(true)}>
          Xoá
        </Button>
      </PageHeader>
      <section className={styles.detailSection} aria-labelledby="family-info-heading">
        <div className={styles.sectionHeading}>
          <h2 id="family-info-heading">Thông tin hộ</h2>
          <p>Địa chỉ và thông tin quản lý của hộ gia đình.</p>
        </div>
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
      </section>
      <section className={styles.section} aria-labelledby="members-heading">
        <div className={styles.sectionHeading}>
          <h2 id="members-heading">Thành viên hiện hành</h2>
          <p>Danh sách những người đang thuộc hộ này.</p>
        </div>
        {!hasHead && <p className={styles.warning}>Hộ này chưa có chủ hộ.</p>}
        {memberError && (
          <p role="alert" className={styles.error}>
            {memberError}
          </p>
        )}
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
                render: (member: FamilyMember) => (
                  <Link to={`/persons/${member.personId}`}>{member.personFullName}</Link>
                ),
              },
              {
                key: 'personHolyName',
                label: 'Tên thánh',
                render: (member: FamilyMember) => member.personHolyName || 'Chưa cập nhật',
              },
              {
                key: 'relationship',
                label: 'Quan hệ',
                render: (member: FamilyMember) => (
                  <select
                    className={styles.inlineSelect}
                    aria-label={`Quan hệ của ${member.personFullName}`}
                    value={member.relationship}
                    disabled={updateMember.isPending}
                    onChange={(event) => {
                      setMemberError(null)
                      void updateMember
                        .mutateAsync({
                          id: member.id,
                          expectedUpdatedAt: member.updatedAt,
                          patch: { relationship: event.target.value as Relationship },
                        })
                        .catch(reportMemberError)
                    }}
                  >
                    {relationshipOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                ),
              },
              {
                key: 'personBirthDate',
                label: 'Ngày sinh',
                render: (member: FamilyMember) => member.personBirthDate || 'Chưa cập nhật',
              },
              { key: 'fromDate', label: 'Ngày vào hộ' },
              {
                key: 'actions',
                label: 'Thao tác',
                render: (member: FamilyMember) => (
                  <>
                    <Button onClick={() => setMemberToMove(member)}>Chuyển hộ</Button>
                    <Button variant="danger" onClick={() => setMemberToRemove(member)}>
                      Gỡ
                    </Button>
                  </>
                ),
              },
            ]}
          />
        )}
      </section>
      <details className={styles.section}>
        <summary>Lịch sử thành viên ({history.length})</summary>
        {history.length === 0 ? (
          <p>Chưa có thành viên đã chuyển đi hoặc được gỡ.</p>
        ) : (
          <Table
            caption="Lịch sử thành viên"
            rows={history}
            columns={[
              { key: 'personFullName', label: 'Họ tên' },
              {
                key: 'relationship',
                label: 'Quan hệ',
                render: (member: FamilyMember) => relationshipLabel(member.relationship),
              },
              { key: 'fromDate', label: 'Từ ngày' },
              { key: 'toDate', label: 'Đến ngày' },
            ]}
          />
        )}
      </details>
      <section className={styles.section} aria-labelledby="activity-heading">
        <div className={styles.sectionHeading}>
          <h2 id="activity-heading">Lịch sử chỉnh sửa</h2>
          <p>Các thay đổi đã được ghi lại trên hộ này.</p>
        </div>
        <ActivityLog entityType="family" entityId={record.id} />
      </section>
      {isEditOpen && (
        <Modal title="Sửa gia đình" onClose={() => setEditOpen(false)}>
          <FamilyForm
            initialValue={record}
            zones={zones.data?.data ?? []}
            submitLabel="Lưu thay đổi"
            isPending={update.isPending}
            onSubmit={async (patch: Record<string, unknown>) => {
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
      {isAddOpen && (
        <Modal
          title="Thêm thành viên"
          onClose={() => {
            setAddOpen(false)
            setPersonSearch('')
          }}
        >
          <FamilyMemberForm
            people={availablePeople}
            personSearch={personSearch}
            onPersonSearchChange={setPersonSearch}
            peopleLoading={people.isLoading}
            isPending={addMember.isPending}
            onSubmit={async (input) => {
              await addMember.mutateAsync({
                ...(input as { personId: string; relationship: Relationship; fromDate: string }),
                familyId: record.id,
              })
              setAddOpen(false)
              setPersonSearch('')
            }}
          />
          <Link to="/persons">Tạo giáo dân mới</Link>
        </Modal>
      )}
      {memberToMove && (
        <Modal title="Chuyển thành viên sang hộ khác" onClose={() => setMemberToMove(null)}>
          <FamilyMemberForm
            mode="move"
            families={destinations}
            initialValue={{ relationship: memberToMove.relationship }}
            showHeadWarning={memberToMove.relationship === 'head'}
            isPending={moveMember.isPending}
            onSubmit={async (input) => {
              await moveMember.mutateAsync({ ...input, personId: memberToMove.personId })
              setMemberToMove(null)
            }}
          />
        </Modal>
      )}
      {memberToRemove && (
        <ConfirmDialog
          title="Gỡ thành viên"
          isPending={removeMember.isPending}
          onClose={() => setMemberToRemove(null)}
          onConfirm={async () => {
            try {
              await removeMember.mutateAsync(memberToRemove.id)
              setMemberToRemove(null)
            } catch (error) {
              reportMemberError(error)
              setMemberToRemove(null)
            }
          }}
        >
          Bạn có chắc muốn gỡ thành viên này khỏi hộ?
        </ConfirmDialog>
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
              setRemoveError(error instanceof AppClientError ? error : null)
            }
          }}
        >
          {removeError?.code === 'CONFLICT'
            ? `Gia đình còn ${(removeError.details as { memberCount?: number } | undefined)?.memberCount ?? ''} thành viên, hãy chuyển những người này sang hộ khác trước.`
            : 'Bạn có chắc muốn xoá mềm gia đình này?'}
        </ConfirmDialog>
      )}
    </section>
  )
}
