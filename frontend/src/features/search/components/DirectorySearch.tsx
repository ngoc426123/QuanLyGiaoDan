import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useDirectorySearch } from '../hooks/useDirectorySearch.ts'
import styles from './DirectorySearch.module.css'

function highlight(value: string, query: string) {
  const term = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
  const segments = value.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'))
  return segments.map((part, index) =>
    part.toLocaleLowerCase('vi') === term ? <mark key={`${part}-${index}`}>{part}</mark> : part,
  )
}

export function DirectorySearch() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('q') ?? ''
  const [input, setInput] = useState(initial)
  const [query, setQuery] = useState(initial)
  const inputRef = useRef<HTMLInputElement>(null)
  const result = useDirectorySearch(query)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = input.trim()
      setQuery(next)
      setParams(next ? { q: next } : {})
    }, 250)
    return () => window.clearTimeout(timer)
  }, [input, setParams])
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  const rows = result.data ?? []
  const persons = rows.filter((row: any) => row.type === 'person')
  const families = rows.filter((row: any) => row.type === 'family')
  return (
    <section>
      <PageHeader
        title="Tìm kiếm"
        description="Tìm giáo dân và gia đình theo tên, tên thánh hoặc địa chỉ."
      />
      <Input
        id="directory-search"
        label="Từ khoá"
        value={input}
        ref={inputRef}
        onChange={(event: any) => setInput(event.target.value)}
      />
      {input.trim() && result.isLoading && <Skeleton />}
      {result.isError && <ErrorState error={result.error} onRetry={result.refetch} />}
      {!input.trim() && (
        <EmptyState title="Nhập từ khoá để tìm kiếm">
          Kết quả sẽ gồm giáo dân và gia đình.
        </EmptyState>
      )}
      {input.trim() && !result.isLoading && !result.isError && rows.length === 0 && (
        <EmptyState
          title="Không có kết quả phù hợp"
          actionLabel="Xoá bộ lọc"
          onAction={() => {
            setInput('')
            setQuery('')
            setParams({})
          }}
        >
          Hãy thử từ khoá khác.
        </EmptyState>
      )}
      {persons.length > 0 && <ResultGroup title="Giáo dân" rows={persons} query={query} />}
      {families.length > 0 && <ResultGroup title="Gia đình" rows={families} query={query} />}
    </section>
  )
}

function ResultGroup({ title, rows, query }: any) {
  return (
    <section className={styles.group}>
      <h2>{title}</h2>
      <ul className={styles.list}>
        {rows.map((row: any) => (
          <li key={row.id}>
            <Link to={row.route}>{highlight(row.title, query)}</Link>
            {row.subtitle && <span>{highlight(row.subtitle, query)}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
