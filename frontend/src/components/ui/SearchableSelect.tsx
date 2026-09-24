import { useEffect, useId, useMemo, useRef, useState } from 'react'
import styles from './SearchableSelect.module.css'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export function SearchableSelect({
  label,
  value = '',
  options = [],
  error = '',
  onChange,
  placeholder = 'Tìm kiếm...',
  emptyLabel = 'Không tìm thấy kết quả',
  getOptionLabel = (option: any) => option.label ?? option.name ?? '',
  getOptionValue = (option: any) => option.value ?? option.id ?? '',
  disabled = false,
  required = false,
  loading = false,
  onSearchChange,
  emptyOptionLabel = '',
}: any) {
  const fieldId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(50)
  const selected = options.find((option: any) => String(getOptionValue(option)) === String(value))
  const selectedLabel = selected ? getOptionLabel(selected) : ''
  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query)
    const matches = !normalizedQuery
      ? options
      : options.filter((option: any) => normalize(getOptionLabel(option)).includes(normalizedQuery))
    if (
      selected &&
      !matches.some((option: any) => getOptionValue(option) === getOptionValue(selected))
    ) {
      return [selected, ...matches]
    }
    return matches
  }, [getOptionLabel, getOptionValue, options, query, selected])
  const visibleOptions = filtered.slice(0, visibleCount)
  const hasMore = visibleOptions.length < filtered.length

  useEffect(() => {
    setVisibleCount(50)
  }, [query, options])

  useEffect(() => {
    const closeWhenOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeWhenOutside)
    return () => document.removeEventListener('mousedown', closeWhenOutside)
  }, [])

  return (
    <div className={styles.field} ref={rootRef}>
      <label htmlFor={fieldId}>{label}</label>
      <div className={styles.control}>
        <input
          id={fieldId}
          className={styles.input}
          value={open ? query : selectedLabel}
          placeholder={placeholder}
          disabled={disabled}
          required={required && !value}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${fieldId}-options`}
          aria-invalid={Boolean(error)}
          onFocus={() => {
            setQuery('')
            onSearchChange?.('')
            setOpen(true)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            onSearchChange?.(event.target.value)
            setOpen(true)
          }}
        />
        <button
          type="button"
          className={styles.toggle}
          aria-label={open ? 'Đóng danh sách' : 'Mở danh sách'}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={styles.chevron} aria-hidden="true" />
        </button>
      </div>
      {open && !disabled && (
        <div
          id={`${fieldId}-options`}
          className={styles.menu}
          role="listbox"
          onScroll={(event: any) => {
            if (
              event.currentTarget.scrollTop + event.currentTarget.clientHeight >=
              event.currentTarget.scrollHeight - 24
            ) {
              setVisibleCount((current) => current + 50)
            }
          }}
        >
          {emptyOptionLabel && (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={styles.option}
              data-selected={!value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange?.('')
                setQuery('')
                setOpen(false)
              }}
            >
              {emptyOptionLabel}
            </button>
          )}
          {visibleOptions.map((option: any) => {
            const optionValue = String(getOptionValue(option))
            const isSelected = optionValue === String(value)
            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                className={styles.option}
                data-selected={isSelected}
                key={optionValue}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange?.(optionValue)
                  setQuery('')
                  setOpen(false)
                }}
              >
                {getOptionLabel(option)}
              </button>
            )
          })}
          {!visibleOptions.length && (
            <p className={styles.empty}>{loading ? 'Đang tải...' : emptyLabel}</p>
          )}
          {hasMore && <p className={styles.loadingHint}>Cuộn để xem thêm</p>}
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
