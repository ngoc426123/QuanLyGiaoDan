import { forwardRef, useState } from 'react'
import { VirtualList } from './VirtualList.tsx'
import styles from './Table.module.css'

function TableRow({ row, columns, active, onContextMenu }) {
  return (
    <tr
      data-active={active || undefined}
      onContextMenu={(event) => {
        event.preventDefault()
        onContextMenu?.(row, event.clientX, event.clientY)
      }}
    >
      {columns.map((column) => (
        <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
      ))}
    </tr>
  )
}

function VirtualRow({ row, columns }) {
  return (
    <div className={styles.virtualRow}>
      {columns.map((column) => (
        <span key={column.key}>
          <span className={styles.muted}>{column.label} : </span>
          {column.render ? column.render(row) : row[column.key]}
        </span>
      ))}
    </div>
  )
}

export const Table = forwardRef<any, any>(function Table(
  { columns, rows, caption, onRowActivate, onRowDelete, onRowContextMenu, ...rest },
  ref,
) {
  const [activeIndex, setActiveIndex] = useState(0)
  const handleKeyDown = (event) => {
    if (event.target !== event.currentTarget || rows.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, rows.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      onRowActivate?.(rows[activeIndex])
    }
    if (event.key === 'Delete') {
      event.preventDefault()
      onRowDelete?.(rows[activeIndex])
    }
  }
  if (rows.length > 200)
    return (
      <VirtualList
        {...rest}
        ref={ref}
        items={rows}
        label={caption}
        renderItem={(row) => <VirtualRow row={row} columns={columns} />}
      />
    )
  return (
    <div role="grid" tabIndex={0} className={styles.keyboardGrid} onKeyDown={handleKeyDown}>
      <table {...rest} ref={ref} className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              row={row}
              columns={columns}
              active={activeIndex === rows.indexOf(row)}
              onContextMenu={onRowContextMenu}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
})
