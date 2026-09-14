import { forwardRef, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import styles from './VirtualList.module.css'

export const VirtualList = forwardRef(function VirtualList(
  { items, renderItem, onActivate, label = 'Danh sách', ...rest },
  ref,
) {
  const viewport = useRef(null)
  const prefix = useId()
  const [geometry, setGeometry] = useState({ top: 0, height: 0, row: 1 })
  const [activeId, setActiveId] = useState(null)
  useImperativeHandle(ref, () => viewport.current)
  useLayoutEffect(() => {
    const node = viewport.current
    const measure = () =>
      setGeometry({
        top: node.scrollTop,
        height: node.clientHeight,
        row: parseFloat(getComputedStyle(node).getPropertyValue('--row-height')) || 1,
      })
    const observer = new ResizeObserver(measure)
    const themeObserver = new MutationObserver(measure)
    observer.observe(node)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-density'],
    })
    measure()
    return () => {
      observer.disconnect()
      themeObserver.disconnect()
    }
  }, [])
  const start = Math.max(0, Math.floor(geometry.top / geometry.row) - 3)
  const end = Math.min(items.length, start + Math.ceil(geometry.height / geometry.row) + 6)
  function handleKey(event) {
    if (event.target !== event.currentTarget || items.length === 0) return
    const current = items.findIndex((item) => item.id === activeId)
    if (event.key === 'Enter') {
      if (current >= 0) onActivate?.(items[current])
      return
    }
    const next = {
      ArrowDown: Math.min(current + 1, items.length - 1),
      ArrowUp: Math.max(0, current - 1),
      Home: 0,
      End: items.length - 1,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    setActiveId(items[next].id)
    viewport.current.scrollTop = next * geometry.row
    setGeometry((state) => ({ ...state, top: viewport.current.scrollTop }))
  }
  const visible = items.slice(start, end)
  return (
    <div
      {...rest}
      ref={viewport}
      className={styles.viewport}
      role="grid"
      aria-rowcount={items.length}
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={
        visible.some((item) => item.id === activeId) ? `${prefix}-${activeId}` : undefined
      }
      onKeyDown={handleKey}
      onScroll={(event) => {
        const top = event.currentTarget.scrollTop
        setGeometry((state) => ({ ...state, top }))
      }}
    >
      <div
        className={styles.spacer}
        style={{ '--virtual-height': `${items.length * geometry.row}px` }}
      >
        {visible.map((item, offset) => (
          <div
            key={item.id}
            id={`${prefix}-${item.id}`}
            role="row"
            aria-rowindex={start + offset + 1}
            aria-selected={item.id === activeId}
            className={styles.row}
            data-active={item.id === activeId}
            style={{ '--virtual-offset': `${(start + offset) * geometry.row}px` }}
          >
            <div role="gridcell">{renderItem(item)}</div>
          </div>
        ))}
      </div>
    </div>
  )
})
