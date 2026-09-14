import { forwardRef } from 'react'
import { Button } from './Button.tsx'
import styles from './Toast.module.css'

export const Toast = forwardRef<any, any>(function Toast(
  { children, isError = false, onDismiss, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} className={styles.toast} role={isError ? 'alert' : 'status'}>
      <span>{children}</span>
      <Button aria-label="Đóng thông báo" onClick={onDismiss}>
        Đóng
      </Button>
    </div>
  )
})
