import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Icon } from '@/components/ui/Icon.tsx'
import { Table } from '@/components/ui/Table.tsx'
import { samplePersons, sampleFamilies, sampleZones } from './sampleData.ts'
import styles from './Preview.module.css'

const statistics = [
  {
    id: 'persons',
    label: 'Giáo dân',
    count: samplePersons.length,
    icon: 'person',
    detail: 'Mỗi người, một câu chuyện',
  },
  {
    id: 'families',
    label: 'Gia đình',
    count: sampleFamilies.length,
    icon: 'family',
    detail: 'Gắn kết trong từng mái ấm',
  },
  {
    id: 'zones',
    label: 'Giáo họ',
    count: sampleZones.length,
    icon: 'zone',
    detail: 'Cùng xây dựng cộng đoàn',
  },
]
const columns = [
  {
    key: 'name',
    label: 'Giáo họ',
    render: (row) => <Link to={`/zones/${row.id}`}>{row.name}</Link>,
  },
  { key: 'familyCount', label: 'Gia đình' },
  { key: 'personCount', label: 'Giáo dân' },
]

function StatisticCard({ item }) {
  return (
    <Link to={`/${item.id}`} className={styles.statistic}>
      <div className={styles.statisticLabel}>
        <span>{item.label}</span>
        <Icon name={item.icon} />
      </div>
      <strong>{item.count}</strong>
      <p>{item.detail}</p>
    </Link>
  )
}

export function DashboardPreview() {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Tổng quan giáo xứ"
        description="Một nơi để gìn giữ và kết nối cộng đoàn."
        isSample
      />
      <section className={styles.welcome}>
        <div>
          <span className={styles.eyebrow}>ĐỒNG HÀNH CÙNG GIÁO XỨ</span>
          <h2>Bắt đầu từ những kết nối thân quen</h2>
          <p>Tra cứu giáo dân, theo dõi các gia đình và tìm hiểu từng giáo họ.</p>
        </div>
        <Link to="/persons">Mở danh bạ giáo dân →</Link>
      </section>
      <section className={styles.statistics} aria-label="Số liệu minh hoạ">
        {statistics.map((item) => (
          <StatisticCard key={item.id} item={item} />
        ))}
      </section>
      <section className={styles.panel}>
        <Table rows={sampleZones} columns={columns} caption="Phân bố theo giáo họ" />
      </section>
    </div>
  )
}
