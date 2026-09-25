import { Children, isValidElement, useMemo } from 'react'
import { SearchableSelect } from './SearchableSelect.tsx'

/** Giữ API `<Select><option /></Select>` nhưng luôn dùng combobox có thể tìm kiếm. */
export function Select({ label, children, error = '', onChange, value = '', ...rest }: any) {
  const { options, emptyOptionLabel } = useMemo(() => {
    const all = Children.toArray(children)
      .filter(isValidElement)
      .map((child: any) => ({
        value: String(child.props.value ?? ''),
        label: String(child.props.children ?? ''),
        disabled: Boolean(child.props.disabled),
      }))
    const empty = all.find((option) => option.value === '')
    return {
      options: all.filter((option) => option.value !== '' && !option.disabled),
      emptyOptionLabel: empty?.label ?? '',
    }
  }, [children])

  return (
    <SearchableSelect
      {...rest}
      label={label}
      value={value ?? ''}
      error={error}
      options={options}
      emptyOptionLabel={emptyOptionLabel}
      getOptionLabel={(option: any) => option.label}
      getOptionValue={(option: any) => option.value}
      onChange={(nextValue: string) => onChange?.({ target: { value: nextValue } })}
    />
  )
}
