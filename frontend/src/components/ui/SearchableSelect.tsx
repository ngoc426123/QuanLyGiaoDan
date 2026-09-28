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
  onLoadMore,
  hasMoreResults = false,
  emptyOptionLabel = '',
}: any) {
  const fieldId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef(new Map<number, HTMLButtonElement>())
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(50)
  const [activeIndex, setActiveIndex] = useState(-1)
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
  const selectableOptions = useMemo(
    () =>
      emptyOptionLabel
        ? [{ value: '', label: emptyOptionLabel }, ...filtered]
        : filtered.map((option: any) => ({
            value: String(getOptionValue(option)),
            label: getOptionLabel(option),
            option,
          })),
    [emptyOptionLabel, filtered, getOptionLabel, getOptionValue],
  )
  const visibleOptions = selectableOptions.slice(0, visibleCount)
  const hasMore = visibleOptions.length < selectableOptions.length

  const selectedIndex = selectableOptions.findIndex((option: any) => option.value === String(value))

  const openMenu = () => {
    setQuery('')
    onSearchChange?.('')
    setVisibleCount(50)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  const selectOption = (option: any) => {
    onChange?.(option.value)
    setQuery('')
    setActiveIndex(-1)
    setOpen(false)
  }

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

  useEffect(() => {
    if (!open || activeIndex < 0) return

    if (activeIndex >= visibleCount) {
      setVisibleCount((current) => Math.max(current + 50, activeIndex + 1))
      return
    }

    optionRefs.current.get(activeIndex)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex, open, visibleCount])

  const moveActiveOption = (direction: 1 | -1) => {
    if (!selectableOptions.length) return
    const currentIndex = activeIndex >= 0 ? activeIndex : selectedIndex
    const nextIndex = Math.min(
      selectableOptions.length - 1,
      Math.max(0, currentIndex < 0 ? (direction > 0 ? 0 : selectableOptions.length - 1) : currentIndex + direction),
    )
    setActiveIndex(nextIndex)
    if (nextIndex >= visibleCount) {
      setVisibleCount((current) => Math.max(current + 50, nextIndex + 1))
    }
  }

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
          aria-activedescendant={
            open && activeIndex >= 0 ? `${fieldId}-option-${activeIndex}` : undefined
          }
          aria-invalid={Boolean(error)}
          onFocus={() => {
            if (!open) openMenu()
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            onSearchChange?.(event.target.value)
            setActiveIndex(0)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              if (!open) {
                openMenu()
                return
              }
              moveActiveOption(event.key === 'ArrowDown' ? 1 : -1)
              return
            }
            if (event.key === 'Enter') {
              if (!open) {
                event.preventDefault()
                openMenu()
                return
              }
              const option = selectableOptions[activeIndex]
              if (option) {
                event.preventDefault()
                selectOption(option)
              }
              return
            }
            if (event.key === 'Escape' && open) {
              event.preventDefault()
              setQuery('')
              setActiveIndex(-1)
              setOpen(false)
            }
          }}
        />
        <button
          type="button"
          className={styles.toggle}
          aria-label={open ? 'Đóng danh sách' : 'Mở danh sách'}
          disabled={disabled}
          onClick={() => {
            if (open) {
              setActiveIndex(-1)
              setOpen(false)
            } else {
              openMenu()
            }
          }}
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
              if (hasMoreResults && !loading) onLoadMore?.()
            }
          }}
        >
          {visibleOptions.map((option: any, index: number) => {
            const isSelected = option.value === String(value)
            const isActive = index === activeIndex
            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                className={styles.option}
                data-selected={isSelected}
                data-active={isActive}
                id={`${fieldId}-option-${index}`}
                key={option.value}
                ref={(element) => {
                  if (element) optionRefs.current.set(index, element)
                  else optionRefs.current.delete(index)
                }}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
              >
                {option.label}
              </button>
            )
          })}
          {!visibleOptions.length && (
            <p className={styles.empty}>{loading ? 'Đang tải...' : emptyLabel}</p>
          )}
          {(hasMore || hasMoreResults) && (
            <p className={styles.loadingHint}>{loading ? 'Đang tải thêm...' : 'Cuộn để xem thêm'}</p>
          )}
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
