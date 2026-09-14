import { Input } from '@/components/ui/Input.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { useFilterStore } from '@/stores/filter.store.ts'
import styles from './Preview.module.css'

export function DirectoryToolbar({ domain }) {
  const filters = useFilterStore((state) => state.filters[domain])
  const setFilter = useFilterStore((state) => state.setFilter)
  return (
    <div className={styles.toolbar}>
      <Input
        label="Tìm trong danh sách"
        type="search"
        value={filters?.search || ''}
        placeholder="Nhập tên hoặc giáo họ…"
        onChange={(event) => setFilter(domain, { ...filters, search: event.target.value })}
      />
      <Select
        label="Sắp xếp"
        value={filters?.sort || 'asc'}
        onChange={(event) => setFilter(domain, { ...filters, sort: event.target.value })}
      >
        <option value="asc">Tên A → Z</option>
        <option value="desc">Tên Z → A</option>
      </Select>
    </div>
  )
}
