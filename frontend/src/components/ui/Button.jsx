import { forwardRef } from 'react'
import styles from './Button.module.css'

export const Button = forwardRef(function Button(
  {
    children,
    isPending = false,
    variant = 'secondary',
    disabled = false,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={styles.button}
      data-variant={variant}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
    >
      {isPending ? 'Đang xử lý…' : children}
    </button>
  )
})
