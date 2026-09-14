import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'

export function TrashPage() {
  return (
    <>
      <PageHeader title="Thùng rác" description="Nơi lưu các bản ghi đã xoá." isSample />
      <EmptyState title="Thùng rác đang trống">Chưa có bản ghi minh hoạ nào bị xoá.</EmptyState>
      <Link to="/">Về tổng quan</Link>
    </>
  )
}
