import { Button } from './Button.tsx'
import styles from './Pagination.module.css'

type Props = { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }

export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (pageCount <= 1) return null
  return (
    <nav className={styles.pagination} aria-label="Phân trang">
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Trang trước
      </Button>
      <span>
        Trang {page} / {pageCount}
      </span>
      <Button disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Trang sau
      </Button>
    </nav>
  )
}
