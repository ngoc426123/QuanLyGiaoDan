import { forwardRef } from 'react'
import { Input } from './Input.jsx'

export const DateInput = forwardRef(function DateInput({ value = '', onChange, ...rest }, ref) {
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
