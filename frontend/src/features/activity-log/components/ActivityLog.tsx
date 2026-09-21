import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useActivityLog } from '../hooks/useActivityLog.ts'

const actionLabels: Record<string, string> = {
  created: 'Tạo mới',
  updated: 'Cập nhật',
  removed: 'Xóa',
  restored: 'Khôi phục',
}

export function ActivityLog({
  entityType,
  entityId,
}: {
  entityType: string
  entityId: string | undefined
}) {
  const history = useActivityLog(entityType, entityId)
  if (history.isPending) return <Skeleton />
  if (history.isError) return <ErrorState error={history.error} onRetry={history.refetch} />
  if (!history.data?.length) {
    return (
      <EmptyState title="Chưa có lịch sử">Các lần thay đổi sau này sẽ được ghi ở đây.</EmptyState>
    )
  }
  return (
    <Table
      caption="Lịch sử chỉnh sửa"
      rows={history.data}
      columns={[
        {
          key: 'createdAt',
          label: 'Thời điểm',
          render: (row: any) => new Date(row.createdAt).toLocaleString('vi-VN'),
        },
        {
          key: 'action',
          label: 'Thao tác',
          render: (row: any) => actionLabels[row.action] ?? row.action,
        },
        {
          key: 'changes',
          label: 'Thay đổi',
          render: (row: any) =>
            Object.entries(row.changes)
              .map(
                ([field, values]: any) =>
                  `${field}: ${values[0] ?? 'trống'} → ${values[1] ?? 'trống'}`,
              )
              .join('; ') || '—',
        },
      ]}
    />
  )
}
