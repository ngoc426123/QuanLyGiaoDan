import { forwardRef, useId } from 'react'
import styles from './Input.module.css'

export const Select = forwardRef<any, any>(function Select(
  { label, children, error = '', id, ...rest },
  ref,
) {
  const generatedId = useId()
  const fieldId = id || generatedId
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId}>{label}</label>
      <select
        {...rest}
        ref={ref}
        id={fieldId}
        className={styles.input}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : rest['aria-describedby']}
      >
        {children}
      </select>
      {error && (
        <p id={`${fieldId}-error`} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
})
