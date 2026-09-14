import { useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useTrash, useTrashMutation } from '@/features/trash/hooks/useTrash.ts'

export function TrashPage() {
  const trash = useTrash()
  const mutation = useTrashMutation()
  const [confirmation, setConfirmation] = useState<any>(null)
  const rows = trash.data ?? []
  return (
    <>
      <PageHeader title="Thùng rác" description="Khôi phục hoặc xoá vĩnh viễn các bản ghi đã xoá.">
        <Button disabled={rows.length === 0} onClick={() => setConfirmation({ action: 'empty' })}>
          Dọn toàn bộ
        </Button>
      </PageHeader>
      {trash.isLoading && <Skeleton />}
      {trash.isError && <ErrorState error={trash.error} onRetry={trash.refetch} />}
      {!trash.isLoading && !trash.isError && rows.length === 0 && (
        <EmptyState title="Thùng rác đang trống">Chưa có bản ghi nào bị xoá.</EmptyState>
      )}
      {rows.map((row: any) => (
        <section key={`${row.type}-${row.id}`}>
          <h2>{row.title}</h2>
          <p>
            {row.type === 'person' ? 'Giáo dân' : row.type === 'family' ? 'Gia đình' : 'Giáo họ'} ·
            Đã xoá {new Date(row.deletedAt).toLocaleDateString('vi-VN')}
          </p>
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ action: 'restore', input: row })}
          >
            Khôi phục
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() => setConfirmation({ action: 'hardRemove', input: row })}
          >
            Xoá vĩnh viễn
          </Button>
        </section>
      ))}
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
    </>
  )
}
