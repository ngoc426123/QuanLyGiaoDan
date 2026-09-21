import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { Icon } from './Icon.tsx'
import inputStyles from './Input.module.css'
import styles from './DateInput.module.css'

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
}

function formatTyping(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return null
  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null
  }
  return `${year}-${month}-${day}`
}

export const DateInput = forwardRef<any, any>(function DateInput(
  { value = '', onChange, onBlur, label, error = '', id, disabled = false, ...rest },
  ref,
) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const textInputRef = useRef<HTMLInputElement | null>(null)
  const pickerRef = useRef<HTMLInputElement | null>(null)
  const [displayValue, setDisplayValue] = useState(() => formatDate(value))

  useEffect(() => setDisplayValue(formatDate(value)), [value])

  const selectDate = (next: string) => {
    setDisplayValue(formatDate(next))
    textInputRef.current?.setCustomValidity('')
    onChange?.(next)
  }

  return (
    <div className={inputStyles.field}>
      {label && <label htmlFor={fieldId}>{label}</label>}
      <div className={styles.control}>
        <input
          {...rest}
          ref={(node) => {
            textInputRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as any).current = node
          }}
          id={fieldId}
          className={`${inputStyles.input} ${styles.textInput}`}
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/yyyy"
          maxLength={10}
          disabled={disabled}
          value={displayValue}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : rest['aria-describedby']}
          onChange={(event) => {
            const next = formatTyping(event.target.value)
            const parsed = parseDate(next)
            setDisplayValue(next)
            event.currentTarget.setCustomValidity(
              next && !parsed ? 'Ngày phải có dạng dd/mm/yyyy và hợp lệ.' : '',
            )
            if (parsed) onChange?.(parsed)
            if (!next) onChange?.('')
          }}
          onBlur={(event) => {
            const parsed = parseDate(displayValue)
            if (parsed) setDisplayValue(formatDate(parsed))
            onBlur?.(event)
          }}
        />
        <button
          type="button"
          className={styles.pickerButton}
          aria-label={`Chọn ${label?.toLocaleLowerCase('vi-VN') ?? 'ngày'}`}
          disabled={disabled}
          onClick={() => {
            if (typeof pickerRef.current?.showPicker === 'function') pickerRef.current.showPicker()
            else pickerRef.current?.click()
          }}
        >
          <Icon name="calendar" />
        </button>
        <input
          ref={pickerRef}
          className={styles.nativePicker}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          disabled={disabled}
          onChange={(event) => selectDate(event.target.value)}
        />
      </div>
      {error && (
        <p id={`${fieldId}-error`} role="alert" className={inputStyles.error}>
          {error}
        </p>
      )}
    </div>
  )
})
