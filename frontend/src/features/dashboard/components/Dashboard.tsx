import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { useDashboard } from '../hooks/useDashboard.ts'
import styles from './Dashboard.module.css'

function initialMonth() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string) {
  const [year, value] = month.split('-')
  return `tháng ${Number(value)}/${year}`
}

export function Dashboard() {
  const [month, setMonth] = useState(initialMonth)
  const query = useDashboard(month)
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
        <div className={styles.sectionHeader}>
          <div>
            <h2>Báo cáo mục vụ</h2>
            <p>Hoạt động ghi nhận trong {monthLabel(month)}.</p>
          </div>
          <Input
            label="Tháng báo cáo"
            type="month"
            value={month}
            onChange={(event: any) => setMonth(event.target.value || initialMonth())}
          />
        </div>
        <div className={styles.pastoralCounts} aria-label="Số liệu mục vụ theo tháng">
          <div>
            <span>Rửa tội</span>
            <strong>{data.pastoral.counts.baptisms}</strong>
          </div>
          <div>
            <span>Rước lễ lần đầu</span>
            <strong>{data.pastoral.counts.firstCommunions}</strong>
          </div>
          <div>
            <span>Thêm sức</span>
            <strong>{data.pastoral.counts.confirmations}</strong>
          </div>
          <div>
            <span>Hôn phối</span>
            <strong>{data.pastoral.counts.marriages}</strong>
          </div>
          <div>
            <span>Qua đời</span>
            <strong>{data.pastoral.counts.deaths}</strong>
          </div>
        </div>
        <h3>Sinh nhật trong {monthLabel(month)}</h3>
        {data.pastoral.birthdays.length ? (
          <Table
            caption="Danh sách sinh nhật trong tháng"
            visuallyHiddenCaption
            rows={data.pastoral.birthdays}
            columns={[
              {
                key: 'fullName',
                label: 'Giáo dân',
                render: (person: any) => (
                  <Link to={`/persons/${person.id}`}>{person.fullName}</Link>
                ),
              },
              { key: 'birthDate', label: 'Ngày sinh' },
              {
                key: 'familyName',
                label: 'Hộ',
                render: (person: any) => person.familyName || 'Chưa thuộc hộ',
              },
              {
                key: 'zoneName',
                label: 'Giáo họ',
                render: (person: any) => person.zoneName || 'Chưa xác định',
              },
            ]}
          />
        ) : (
          <p className={styles.muted}>Không có sinh nhật nào được ghi nhận trong tháng này.</p>
        )}
      </section>
      <section className={styles.section}>
        <h2>Chất lượng dữ liệu</h2>
        <p className={styles.sectionDescription}>
          Các mục dưới đây cần được kiểm tra thủ công; hệ thống không tự gộp hoặc thay đổi hồ sơ.
        </p>
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
          <div>
            <h3>Thiếu ngày sinh ({data.dataQuality.personsWithoutBirthDate.total})</h3>
            {data.dataQuality.personsWithoutBirthDate.records.length ? (
              <ul>
                {data.dataQuality.personsWithoutBirthDate.records.map((person: any) => (
                  <li key={person.id}>
                    <Link to={`/persons/${person.id}`}>{person.fullName}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Không có hồ sơ nào thiếu ngày sinh.</p>
            )}
          </div>
          <div>
            <h3>Số điện thoại trùng ({data.dataQuality.duplicatePhones.total})</h3>
            {data.dataQuality.duplicatePhones.groups.length ? (
              <ul className={styles.duplicatePhones}>
                {data.dataQuality.duplicatePhones.groups.map((group: any) => (
                  <li key={group.phone}>
                    <strong>{group.phone}</strong>
                    <span>
                      {group.persons.map((person: any, index: number) => (
                        <span key={person.id}>
                          {index > 0 && ', '}
                          <Link to={`/persons/${person.id}`}>{person.fullName}</Link>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Không có số điện thoại nào trùng.</p>
            )}
          </div>
        </div>
      </section>
    </section>
  )
}
