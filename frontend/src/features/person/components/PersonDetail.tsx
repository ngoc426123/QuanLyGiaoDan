import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
import { ActivityLog } from '@/features/activity-log/components/ActivityLog.tsx'
import { useReportExport } from '@/features/report/hooks/useCsvExport.ts'
import { useRemovePerson } from '../hooks/usePersonMutations.ts'
import { usePerson } from '../hooks/usePersons.ts'
import styles from './Person.module.css'

const genderLabel = (value: string | null) =>
  value === 'male' ? 'Nam' : value === 'female' ? 'Nữ' : 'Chưa cập nhật'
const sacramentLabel = Object.freeze({
  baptism: 'Rửa tội',
  first_communion: 'Rước lễ lần đầu',
  confirmation: 'Thêm sức',
  marriage: 'Hôn phối',
})
const initiationSacramentTypes = Object.freeze(['baptism', 'first_communion', 'confirmation'])
const residenceLabel = Object.freeze({
  permanent: 'Thường trú',
  temporary: 'Tạm trú',
  moved_away: 'Đã chuyển đi',
})
const pastoralLabel = Object.freeze({
  ordinary: 'Bình thường',
  catechism: 'Đang học giáo lý',
  catechist: 'Giáo lý viên',
  needs_visit: 'Cần thăm viếng',
})
export function PersonDetail({ id }: { id: string | undefined }) {
  const location = useLocation()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.add)
  const [isRemoveOpen, setRemoveOpen] = useState(location.state?.action === 'remove')
  const [isMoveOpen, setMoveOpen] = useState(location.state?.action === 'move')
  const person = usePerson(id)
  const families = useFamilies({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
  const remove = useRemovePerson()
  const moveMember = useMoveFamilyMember()
  const exportProfile = useReportExport('pdf')
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
  const sacramentByType = Object.fromEntries(
    (record.sacraments ?? []).map((sacrament: any) => [sacrament.type, sacrament]),
  )
  const marriage = record.marriage
  return (
    <section>
      <Link to="/persons">Về danh sách giáo dân</Link>
      <PageHeader title="Hồ sơ giáo dân" description={record.fullName}>
        <Button
          variant="secondary"
          isPending={exportProfile.isPending}
          disabled={exportProfile.isPending}
          onClick={() =>
            exportProfile.mutate({ report: 'personProfile', filter: { personId: record.id } })
          }
        >
          Xuất PDF
        </Button>
        <Button onClick={() => navigate(`/persons/${record.id}/edit`)}>Sửa</Button>
        <Button variant="danger" onClick={() => setRemoveOpen(true)}>
          Xoá
        </Button>
      </PageHeader>
      <section className={styles.detailSection} aria-labelledby="administrative-heading">
        <div className={styles.sectionHeading}>
          <h2 id="administrative-heading">Thông tin hành chính</h2>
          <p>Thông tin nhận diện, liên hệ và tình trạng hiện tại của giáo dân.</p>
        </div>
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
            <dt>Email</dt>
            <dd>{record.email || 'Chưa cập nhật'}</dd>
          </div>
          <div>
            <dt>Nghề nghiệp</dt>
            <dd>{record.occupation || 'Chưa cập nhật'}</dd>
          </div>
          <div>
            <dt>Số liên hệ thay thế</dt>
            <dd>{record.secondaryPhone || 'Chưa cập nhật'}</dd>
          </div>
          <div>
            <dt>Tình trạng cư trú</dt>
            <dd>{residenceLabel[record.residenceStatus] || 'Chưa cập nhật'}</dd>
          </div>
          <div>
            <dt>Tình trạng mục vụ</dt>
            <dd>{pastoralLabel[record.pastoralStatus] || 'Chưa cập nhật'}</dd>
          </div>
          <div>
            <dt>Ngày qua đời</dt>
            <dd>{record.deathDate || 'Chưa cập nhật'}</dd>
          </div>
          <div>
            <dt>Ghi chú</dt>
            <dd>{record.note || 'Không có ghi chú'}</dd>
          </div>
          <div>
            <dt>Ghi chú mục vụ</dt>
            <dd>{record.pastoralNote || 'Không có ghi chú'}</dd>
          </div>
        </dl>
      </section>
      <section className={styles.section} aria-labelledby="sacraments-heading">
        <div className={styles.sectionHeading}>
          <h2 id="sacraments-heading">Đời sống bí tích</h2>
          <p>Thông tin các bí tích khai tâm đã được ghi nhận.</p>
        </div>
        <div className={styles.sacramentGrid}>
          {initiationSacramentTypes.map((type) => {
            const sacrament = sacramentByType[type]
            return (
              <dl key={type} className={styles.sacramentDetail}>
                <dt>{sacramentLabel[type]}</dt>
                <dd>{sacrament?.date || 'Chưa cập nhật'}</dd>
                <dt>Linh mục cử hành</dt>
                <dd>{sacrament?.minister || 'Chưa cập nhật'}</dd>
                <dt>Nơi cử hành</dt>
                <dd>{sacrament?.place || 'Chưa cập nhật'}</dd>
              </dl>
            )
          })}
        </div>
      </section>
      <section className={styles.section} aria-labelledby="marriage-heading">
        <div className={styles.sectionHeading}>
          <h2 id="marriage-heading">Thông tin hôn phối</h2>
          <p>Quan hệ hôn nhân và thông tin lễ cưới được ghi nhận.</p>
        </div>
        <div className={styles.sectionActions}>
          <Link to="/marriages">Quản lý hôn phối</Link>
        </div>
        <dl className={`${styles.sacramentDetail} ${styles.marriageDetail}`}>
          <dt>Tình trạng hôn phối</dt>
          <dd>{marriage ? 'Đã kết hôn' : 'Độc thân'}</dd>
          {marriage && (
            <>
              <dt>Người phối ngẫu</dt>
              <dd>
                <Link to={`/persons/${marriage.spouseId}`}>{marriage.spouseFullName}</Link>
              </dd>
              <dt>Ngày cử hành</dt>
              <dd>{marriage.date}</dd>
              <dt>Linh mục cử hành</dt>
              <dd>{marriage.minister || 'Chưa cập nhật'}</dd>
              <dt>Nơi cử hành</dt>
              <dd>{marriage.place || 'Chưa cập nhật'}</dd>
            </>
          )}
        </dl>
      </section>
      <section className={styles.section} aria-labelledby="membership-heading">
        <div className={styles.sectionHeading}>
          <h2 id="membership-heading">Hộ hiện hành</h2>
          <p>Hộ gia đình hiện tại và vai trò của giáo dân trong hộ.</p>
        </div>
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
        <div className={styles.sectionHeading}>
          <h2 id="history-heading">Lịch sử hộ</h2>
          <p>Các lần gán hộ, chuyển hộ hoặc kết thúc tư cách thành viên.</p>
        </div>
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
      <section className={styles.section} aria-labelledby="activity-heading">
        <div className={styles.sectionHeading}>
          <h2 id="activity-heading">Lịch sử chỉnh sửa</h2>
          <p>Các thay đổi đã được ghi lại trên hồ sơ này.</p>
        </div>
        <ActivityLog entityType="person" entityId={record.id} />
      </section>
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
