import { useEffect, useRef } from 'react'
import { Button } from './Button.tsx'
import styles from './RowContextMenu.module.css'

export function RowContextMenu({ x, y, items, onClose }: any) {
  const menu = useRef<HTMLDivElement>(null)
  useEffect(() => {
    menu.current?.focus()
    const close = () => onClose()
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [onClose])
  return (
    <div ref={menu} role="menu" tabIndex={-1} className={styles.menu} style={{ left: x, top: y }}>
      {items.map((item: any) => (
        <Button
          key={item.label}
          role="menuitem"
          variant={item.danger ? 'danger' : 'secondary'}
          onClick={item.onClick}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}
