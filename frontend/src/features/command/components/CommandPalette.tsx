import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import styles from './CommandPalette.module.css'

const actions = [
  { label: 'Tổng quan', path: '/' },
  { label: 'Thêm giáo dân mới', path: '/persons?new=1' },
  { label: 'Danh sách giáo dân', path: '/persons' },
  { label: 'Danh sách gia đình', path: '/families' },
  { label: 'Danh sách giáo họ', path: '/zones' },
  { label: 'Tìm kiếm danh bạ', path: '/search' },
  { label: 'Thùng rác', path: '/trash' },
  { label: 'Cài đặt', path: '/settings' },
]

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const visible = useMemo(
    () =>
      actions.filter((action) =>
        action.label.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')),
      ),
    [query],
  )
  useEffect(() => setActive(0), [query])
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  function select(index: number) {
    const action = visible[index]
    if (!action) return
    navigate(action.path)
    onClose()
  }
  return (
    <Modal title="Bảng lệnh" onClose={onClose}>
      <Input
        label="Tìm lệnh"
        ref={inputRef}
        value={query}
        onChange={(event: any) => setQuery(event.target.value)}
        onKeyDown={(event: any) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive((active + 1) % Math.max(visible.length, 1))
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((active - 1 + visible.length) % Math.max(visible.length, 1))
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            select(active)
          }
        }}
      />
      <ul className={styles.list}>
        {visible.map((action, index) => (
          <li key={action.path}>
            <button
              type="button"
              data-active={index === active || undefined}
              onMouseEnter={() => setActive(index)}
              onClick={() => select(index)}
            >
              {action.label}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
