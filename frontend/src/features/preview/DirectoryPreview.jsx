import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader.jsx'
import { useFilterStore } from '@/stores/filter.store.js'
import { directories, normalizeSearch } from './sampleData.js'
import { DirectoryTable } from './DirectoryTable.jsx'
import { DirectoryToolbar } from './DirectoryToolbar.jsx'
import styles from './Preview.module.css'

export function DirectoryPreview({ domain }) {
  const navigate = useNavigate()
  const filters = useFilterStore((state) => state.filters[domain])
  const clear = useFilterStore((state) => state.clear)
  const config = directories[domain]
  const search = filters?.search || ''
  const sort = filters?.sort || 'asc'
  const rows = config.rows
    .filter((row) =>
      normalizeSearch(Object.values(row).join(' ')).includes(normalizeSearch(search)),
    )
    .sort(
      (a, b) =>
        a[config.nameKey].localeCompare(b[config.nameKey], 'vi') * (sort === 'asc' ? 1 : -1),
    )
  return (
    <div className={styles.page}>
      <PageHeader title={config.title} description={config.description} isSample />
      <div className={styles.panel}>
        <DirectoryToolbar domain={domain} />
        <DirectoryTable
          config={config}
          domain={domain}
          rows={rows}
          state={config.rows.length ? 'success' : 'empty'}
          onClear={() => (config.rows.length ? clear(domain) : navigate('/'))}
        />
      </div>
    </div>
  )
}
