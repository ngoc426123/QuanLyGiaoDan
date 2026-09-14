import { forwardRef } from 'react'
import styles from './Spinner.module.css'

export const Spinner = forwardRef<any, any>(function Spinner(
  { label = 'Đang tải…', ...rest },
  ref,
) {
  return (
    <span {...rest} ref={ref} role="status" className={styles.spinner}>
      <span aria-hidden="true" className={styles.circle} />
      {label}
    </span>
  )
})
