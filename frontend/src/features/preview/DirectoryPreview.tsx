import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { useFilterStore } from '@/stores/filter.store.ts'
import { directories, normalizeSearch } from './sampleData.ts'
import { DirectoryTable } from './DirectoryTable.tsx'
import { DirectoryToolbar } from './DirectoryToolbar.tsx'
import styles from './Preview.module.css'

export function DirectoryPreview({ domain }: any) {
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
        (a[config.nameKey] as string).localeCompare(b[config.nameKey] as string, 'vi') *
        (sort === 'asc' ? 1 : -1),
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
          error={null}
          onClear={() => (config.rows.length ? clear(domain) : navigate('/'))}
          onRetry={() => {}}
        />
      </div>
    </div>
  )
}
