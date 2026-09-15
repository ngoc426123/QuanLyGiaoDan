import { type KeyboardEvent, useEffect, useRef } from 'react'
import styles from './RowContextMenu.module.css'

export function RowContextMenu({ x, y, items, onClose }: any) {
  const menu = useRef<HTMLDivElement>(null)
  useEffect(() => {
    menu.current?.focus()
    const close = () => onClose()
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [onClose])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <div
      ref={menu}
      role="menu"
      tabIndex={-1}
      className={styles.menu}
      style={{ left: x, top: y }}
      onKeyDown={handleKeyDown}
    >
      {items.map((item: any, index: number) => (
        <div key={item.label}>
          {item.danger && index > 0 && !items[index - 1].danger ? (
            <div role="separator" className={styles.separator} />
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={`${styles.item}${item.danger ? ` ${styles.danger}` : ''}`}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}
