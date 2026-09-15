import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useDashboard } from '../hooks/useDashboard.ts'
import styles from './Dashboard.module.css'

export function Dashboard() {
  const query = useDashboard()
  if (query.isLoading) return <Skeleton />
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />
  const data = query.data
  if (!data)
    return <EmptyState title="Chưa có số liệu">Hãy thử tải lại trang tổng quan.</EmptyState>
  return (
    <section>
      <PageHeader
        title="Tổng quan giáo xứ"
        description="Theo dõi số liệu và những bản ghi cần bổ sung."
      >
        <Link to="/persons">
          <Button variant="primary">Thêm giáo dân</Button>
        </Link>
        <Link to="/families">
          <Button>Thêm hộ</Button>
        </Link>
      </PageHeader>
      <section className={styles.statistics} aria-label="Số liệu tổng quan">
        <Link to="/persons" className={styles.statistic}>
          <span>Giáo dân đang sống</span>
          <strong>{data.livingPersonCount}</strong>
        </Link>
        <Link to="/families" className={styles.statistic}>
          <span>Tổng hộ</span>
          <strong>{data.familyCount}</strong>
        </Link>
        <Link to="/zones" className={styles.statistic}>
          <span>Tổng giáo họ</span>
          <strong>{data.zoneCount}</strong>
        </Link>
      </section>
      <section className={styles.section}>
        <h2>Phân bố theo giáo họ</h2>
        {data.zones.length ? (
          <Table
            caption="Bảng phân bố theo giáo họ"
            visuallyHiddenCaption
            rows={data.zones}
            columns={[
              {
                key: 'name',
                label: 'Giáo họ',
                render: (zone: { id: string; name: string }) => (
                  <Link to={`/zones/${zone.id}`}>{zone.name}</Link>
                ),
              },
              { key: 'familyCount', label: 'Số hộ' },
              { key: 'personCount', label: 'Số giáo dân' },
            ]}
          />
        ) : (
          <EmptyState title="Chưa có giáo họ">Tạo giáo họ đầu tiên để bắt đầu quản lý.</EmptyState>
        )}
      </section>
      <section className={styles.section}>
        <h2>Cảnh báo dữ liệu</h2>
        <div className={styles.warnings}>
          <div>
            <h3>Hộ chưa có chủ hộ ({data.familiesWithoutHead.length})</h3>
            {data.familiesWithoutHead.length ? (
              <ul>
                {data.familiesWithoutHead.map((family: { id: string; name: string }) => (
                  <li key={family.id}>
                    <Link to={`/families/${family.id}`}>{family.name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Không có hộ nào thiếu chủ hộ.</p>
            )}
          </div>
          <div>
            <h3>Giáo dân chưa thuộc hộ ({data.personsWithoutFamily.length})</h3>
            {data.personsWithoutFamily.length ? (
              <ul>
                {data.personsWithoutFamily.map((person: { id: string; fullName: string }) => (
                  <li key={person.id}>
                    <Link to={`/persons/${person.id}`}>{person.fullName}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Không có giáo dân nào chưa thuộc hộ.</p>
            )}
          </div>
        </div>
      </section>
    </section>
  )
}
