import { forwardRef } from 'react'
import styles from './PageHeader.module.css'

export const PageHeader = forwardRef<any, any>(function PageHeader(
  { title, description, isSample = false, children, ...rest },
  ref,
) {
  return (
    <header {...rest} ref={ref} className={styles.header}>
      <div className={styles.heading}>
        <div className={styles.title}>
          <h1>{title}</h1>
          {isSample && <span className={styles.badge}>Dữ liệu minh hoạ</span>}
        </div>
        {description && <p>{description}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  )
})
