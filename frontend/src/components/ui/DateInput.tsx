import { forwardRef } from 'react'
import { Input } from './Input.tsx'

export const DateInput = forwardRef<any, any>(function DateInput(
  { value = '', onChange, ...rest },
  ref,
) {
  return (
    <Input
      {...rest}
      ref={ref}
      type="date"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
})
