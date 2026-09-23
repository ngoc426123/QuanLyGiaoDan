import { useQuery } from '@tanstack/react-query'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { invokeWithMeta } from '@/shared/invoke.ts'

const labels = Object.freeze({
  baptism: 'Rửa tội',
  first_communion: 'Rước lễ lần đầu',
  confirmation: 'Thêm sức',
  marriage: 'Hôn phối',
})

export function CertificateHistory() {
  const certificates = useQuery({
    queryKey: ['certificates'],
    queryFn: () => invokeWithMeta(window.api.certificate.list({ page: 1, pageSize: 200 })),
  })
  if (certificates.isPending) return <Skeleton />
  if (certificates.isError)
    return <ErrorState error={certificates.error} onRetry={certificates.refetch} />
  const rows = certificates.data?.data ?? []
  return (
    <section>
      <PageHeader
        title="Nhật ký chứng thư"
        description="Các chứng thư PDF đã được cấp từ hồ sơ giáo dân."
      />
      <Table
        caption="Nhật ký phát hành chứng thư"
        rows={rows}
        columns={[
          { key: 'personFullName', label: 'Giáo dân' },
          { key: 'type', label: 'Chứng thư', render: (row: any) => labels[row.type] },
          { key: 'registerBook', label: 'Số quyển' },
          { key: 'registerPage', label: 'Số tờ' },
          { key: 'registerEntry', label: 'Số thứ tự sổ' },
          {
            key: 'issuedAt',
            label: 'Thời điểm cấp',
            render: (row: any) => new Date(row.issuedAt).toLocaleString('vi-VN'),
          },
        ]}
      />
    </section>
  )
}
