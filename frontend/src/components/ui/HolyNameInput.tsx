import { useEffect, useId, useMemo, useRef, useState } from 'react'
import styles from './SearchableSelect.module.css'

const HOLY_NAMES = [
  'Maria',
  'Giuse',
  'Gioan',
  'Anna',
  'Antôn',
  'Phêrô',
  'Phaolô',
  'Têrêsa',
  'Catarina',
  'Phanxicô',
  'Đa Minh',
  'Inhaxiô',
  'Micae',
  'Tôma',
  'Luca',
  'Mátthêu',
  'Mác-cô',
  'Anrê',
  'Giacôbê',
  'Bênêđictô',
  'Clara',
  'Agnês',
  'Monica',
  'Elisabeth',
  'Rita',
  'Cecilia',
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/** Input tự do với danh sách gợi ý; mặc định là các tên thánh thông dụng. */
export function HolyNameInput({
  label,
  value = '',
  error = '',
  onChange,
  id,
  suggestionValues = HOLY_NAMES,
  ...rest
}: any) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef(new Map<number, HTMLButtonElement>())
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const suggestions = useMemo(() => {
    const query = normalize(String(value))
    return query
      ? suggestionValues.filter((name: string) => normalize(name).includes(query))
      : suggestionValues
  }, [suggestionValues, value])

  useEffect(() => {
    const closeWhenOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setActiveIndex(-1)
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', closeWhenOutside)
    return () => document.removeEventListener('mousedown', closeWhenOutside)
  }, [])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    optionRefs.current.get(activeIndex)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex, open])

  const choose = (name: string) => {
    onChange?.({ target: { value: name } })
    setActiveIndex(-1)
    setOpen(false)
  }

  return (
    <div className={styles.field} ref={rootRef}>
      {label && <label htmlFor={fieldId}>{label}</label>}
      <input
        {...rest}
        id={fieldId}
        className={styles.input}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${fieldId}-options`}
        aria-activedescendant={open && activeIndex >= 0 ? `${fieldId}-option-${activeIndex}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : rest['aria-describedby']}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange?.(event)
          setActiveIndex(-1)
          setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
            if (!suggestions.length) return
            setActiveIndex((current) => {
              if (current < 0) return event.key === 'ArrowDown' ? 0 : suggestions.length - 1
              return Math.min(suggestions.length - 1, Math.max(0, current + (event.key === 'ArrowDown' ? 1 : -1)))
            })
            return
          }
          if (event.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
            event.preventDefault()
            choose(suggestions[activeIndex])
            return
          }
          if (event.key === 'Escape') {
            setActiveIndex(-1)
            setOpen(false)
          }
        }}
      />
      {open && (
        <div id={`${fieldId}-options`} className={styles.menu} role="listbox">
          {suggestions.map((name, index) => (
            <button
              type="button"
              role="option"
              aria-selected={name === value}
              className={styles.option}
              data-selected={name === value}
              data-active={index === activeIndex}
              id={`${fieldId}-option-${index}`}
              key={name}
              ref={(element) => {
                if (element) optionRefs.current.set(index, element)
                else optionRefs.current.delete(index)
              }}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => choose(name)}
            >
              {name}
            </button>
          ))}
          {!suggestions.length && <p className={styles.empty}>Không có gợi ý phù hợp</p>}
        </div>
      )}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
