import { Link } from 'react-router-dom'
import { Table } from '@/components/ui/Table.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'

export function DirectoryTable({
  config,
  domain,
  rows,
  state = 'success',
  error,
  onRetry,
  onClear,
}) {
  if (state === 'loading') return <Skeleton />
  if (state === 'error') return <ErrorState error={error} onRetry={onRetry} />
  if (state === 'empty')
    return (
      <EmptyState title="Chưa có dữ liệu" actionLabel="Về tổng quan" onAction={onClear}>
        Danh sách này chưa có bản ghi.
      </EmptyState>
    )
  if (rows.length === 0)
    return (
      <EmptyState title="Không có kết quả khớp bộ lọc" actionLabel="Xoá bộ lọc" onAction={onClear}>
        Hãy thử một từ khoá khác hoặc xoá bộ lọc.
      </EmptyState>
    )
  const columns = Object.entries(config.fields).map(([key, label]) => ({
    key,
    label,
    render:
      key === config.nameKey
        ? (row) => <Link to={`/${domain}/${row.id}`}>{row[key]}</Link>
        : undefined,
  }))
  return (
    <Table
      columns={columns}
      rows={rows}
      caption={`${config.title} · ${rows.length} bản ghi minh hoạ`}
    />
  )
}
