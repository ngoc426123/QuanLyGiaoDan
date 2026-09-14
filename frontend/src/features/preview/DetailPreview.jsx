import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { directories } from './sampleData.js'
import styles from './Preview.module.css'

export function DetailPreview({ domain, title }) {
  const { id } = useParams()
  const config = directories[domain]
  const record = config.rows.find((item) => item.id === id)
  return (
    <div className={styles.page}>
      <Link className={styles.back} to={`/${domain}`}>
        ← Về danh sách {config.title.toLocaleLowerCase('vi')}
      </Link>
      <PageHeader title={title} description={record?.[config.nameKey]} isSample />
      {record ? (
        <dl className={styles.details}>
          {Object.entries(config.fields).map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{record[key]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <EmptyState title="Không tìm thấy bản ghi minh hoạ">
          Chọn một bản ghi từ danh sách để xem.
        </EmptyState>
      )}
    </div>
  )
}
