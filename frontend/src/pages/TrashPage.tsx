import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { Icon } from '@/components/ui/Icon.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useTrash, useTrashMutation } from '@/features/trash/hooks/useTrash.ts'
import { formatDate } from '@/shared/date.ts'
import styles from './TrashPage.module.css'

const typeMeta: Record<string, { label: string; icon: string }> = {
  person: { label: 'Giáo dân', icon: 'person' },
  marriage: { label: 'Hôn phối', icon: 'marriage' },
  family: { label: 'Gia đình', icon: 'family' },
  family_member: { label: 'Thành viên hộ', icon: 'person' },
  zone: { label: 'Giáo họ', icon: 'zone' },
}

function getTypeMeta(type: string) {
  return typeMeta[type] ?? { label: 'Bản ghi khác', icon: 'overview' }
}

export function TrashPage() {
  const trash = useTrash()
  const mutation = useTrashMutation()
  const [confirmation, setConfirmation] = useState<any>(null)
  const rows = trash.data ?? []
  const counts = useMemo(
    () =>
      rows.reduce(
        (current: Record<string, number>, row: any) => ({
          ...current,
          [row.type]: (current[row.type] ?? 0) + 1,
        }),
        {},
      ),
    [rows],
  )
  return (
    <section className={styles.page}>
      <PageHeader title="Thùng rác" description="Khôi phục hoặc xoá vĩnh viễn các bản ghi đã xoá.">
        <Button
          variant="danger"
          disabled={rows.length === 0}
          onClick={() => setConfirmation({ action: 'empty' })}
        >
          <Icon name="trash" />
          Dọn toàn bộ
        </Button>
      </PageHeader>
      {trash.isLoading && <Skeleton />}
      {trash.isError && <ErrorState error={trash.error} onRetry={trash.refetch} />}
      {!trash.isLoading && !trash.isError && rows.length === 0 && (
        <EmptyState title="Thùng rác đang trống">Chưa có bản ghi nào bị xoá.</EmptyState>
      )}
      {!trash.isLoading && !trash.isError && rows.length > 0 && (
        <>
          <div className={styles.summary} aria-label="Thống kê bản ghi trong thùng rác">
            <span className={styles.total}>{rows.length} bản ghi đã xoá</span>
            {Object.entries(counts).map(([type, count]) => {
              const meta = getTypeMeta(type)
              return (
                <span className={styles.summaryItem} data-type={type} key={type}>
                  <Icon name={meta.icon} />
                  {count as number} {meta.label.toLowerCase()}
                </span>
              )
            })}
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Các bản ghi đã xoá</caption>
              <thead>
                <tr>
                  <th scope="col">Bản ghi</th>
                  <th scope="col">Loại</th>
                  <th scope="col">Đã xoá</th>
                  <th scope="col" className={styles.actionsHeading}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => {
                  const meta = getTypeMeta(row.type)
                  return (
                    <tr key={`${row.type}-${row.id}`}>
                      <td data-label="Bản ghi">
                        <div className={styles.record}>
                          <span className={styles.recordIcon} data-type={row.type}>
                            <Icon name={meta.icon} />
                          </span>
                          <h2 className={styles.recordTitle}>{row.title}</h2>
                        </div>
                      </td>
                      <td data-label="Loại">
                        <span className={styles.typeBadge} data-type={row.type}>
                          {meta.label}
                        </span>
                      </td>
                      <td data-label="Đã xoá" className={styles.deletedAt}>
                        {formatDate(row.deletedAt)}
                      </td>
                      <td data-label="Thao tác" className={styles.actions}>
                        <Button
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate({ action: 'restore', input: row })}
                        >
                          <Icon name="restore" />
                          Khôi phục
                        </Button>
                        <Button
                          variant="danger"
                          disabled={mutation.isPending}
                          onClick={() => setConfirmation({ action: 'hardRemove', input: row })}
                        >
                          Xoá vĩnh viễn
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {confirmation && (
        <ConfirmDialog
          title={confirmation.action === 'empty' ? 'Dọn toàn bộ thùng rác' : 'Xoá vĩnh viễn'}
          isPending={mutation.isPending}
          onClose={() => setConfirmation(null)}
          onConfirm={() =>
            mutation.mutate(confirmation, { onSuccess: () => setConfirmation(null) })
          }
        >
          Thao tác này không thể hoàn tác.
        </ConfirmDialog>
      )}
    </section>
  )
}
