import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { samplePersons, sampleFamilies, normalizeSearch } from './sampleData.ts'
import styles from './Preview.module.css'

export function SearchPreview() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const allRows = [
    ...samplePersons.map((row) => ({
      ...row,
      title: row.fullName,
      route: `/persons/${row.id}`,
      type: 'Giáo dân',
    })),
    ...sampleFamilies.map((row) => ({
      ...row,
      title: row.name,
      route: `/families/${row.id}`,
      type: 'Gia đình',
    })),
  ]
  const results = query.trim()
    ? allRows.filter((row) => normalizeSearch(row.title).includes(normalizeSearch(query.trim())))
    : []
  return (
    <div className={styles.page}>
      <PageHeader
        title="Tìm kiếm"
        description={
          query
            ? `Kết quả cho “${query}”`
            : 'Tìm giáo dân hoặc gia đình bằng tên, có dấu hoặc không dấu.'
        }
        isSample
      />
      {!query.trim() && (
        <EmptyState title="Bạn muốn tìm ai?">
          Nhập từ khoá vào ô tìm kiếm ở thanh trên và nhấn Enter.
        </EmptyState>
      )}
      {query.trim() && results.length === 0 && (
        <EmptyState
          title="Không có kết quả khớp bộ lọc"
          actionLabel="Xoá bộ lọc"
          onAction={() => setParams({})}
        >
          Hãy thử từ khoá ngắn hơn.
        </EmptyState>
      )}
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((row) => (
            <li key={row.id}>
              <Link to={row.route}>{row.title}</Link>
              <span>{row.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
