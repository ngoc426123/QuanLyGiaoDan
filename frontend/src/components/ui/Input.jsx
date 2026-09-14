import { forwardRef, useId } from 'react'
import styles from './Input.module.css'

export const Input = forwardRef(function Input({ label, error = '', id, ...rest }, ref) {
  const generatedId = useId()
  const fieldId = id || generatedId
  return (
    <div className={styles.field}>
      {label && <label htmlFor={fieldId}>{label}</label>}
      <input
        {...rest}
        ref={ref}
        id={fieldId}
        className={styles.input}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : rest['aria-describedby']}
      />
      {error && (
        <p id={`${fieldId}-error`} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
})
