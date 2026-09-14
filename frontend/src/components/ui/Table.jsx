import { forwardRef } from 'react'
import { VirtualList } from './VirtualList.jsx'
import styles from './Table.module.css'

function TableRow({ row, columns }) {
  return (
    <tr>
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

export const Table = forwardRef(function Table({ columns, rows, caption, ...rest }, ref) {
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
          <TableRow key={row.id} row={row} columns={columns} />
        ))}
      </tbody>
    </table>
  )
})
