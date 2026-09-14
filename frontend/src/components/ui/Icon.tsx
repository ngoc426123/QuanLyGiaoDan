import { forwardRef } from 'react'
import styles from './Icon.module.css'

const paths = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  person: 'M16 7a4 4 0 1 1-8 0a4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
  family: 'M3 11l9-8 9 8 M5 10v11h14V10 M10 21v-7h4v7',
  zone: 'M4 21V10h16v11 M2 21h20 M9 10V6l3-3 3 3v4 M12 1v4 M10 21v-6h4v6',
  settings: 'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6',
  search: 'M17 10a7 7 0 1 1-14 0a7 7 0 0 1 14 0 M15 15l6 6',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  trash: 'M3 6h18 M5 6l1 15h12l1-15 M9 6V3h6v3 M10 10v7 M14 10v7',
  close: 'M6 6l12 12 M18 6L6 18',
  minimize: 'M5 12h14',
  maximize: 'M5 5h14v14H5z',
  restore: 'M8 8h11v11H8z M5 16V5h11',
}

export const Icon = forwardRef<any, any>(function Icon({ name, ...rest }, ref) {
  return (
    <svg
      {...rest}
      ref={ref}
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.overview} />
    </svg>
  )
})
