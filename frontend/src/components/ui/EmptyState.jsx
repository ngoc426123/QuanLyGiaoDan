import { forwardRef } from 'react'
import { Button } from './Button.jsx'
import styles from './EmptyState.module.css'

export const EmptyState = forwardRef(function EmptyState(
  { title = 'Chưa có dữ liệu', children, actionLabel, onAction, ...rest },
  ref,
) {
  return (
    <section {...rest} ref={ref} className={styles.state}>
      <span className={styles.symbol} aria-hidden="true">
        ◇
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </section>
  )
})
