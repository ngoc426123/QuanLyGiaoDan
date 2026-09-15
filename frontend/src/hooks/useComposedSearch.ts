import { useEffect, useRef, useState } from 'react'

/**
 * Keeps IME composition local to the input before synchronizing a search term externally.
 * Updating router state during composition interrupts Telex/VNI in Electron.
 */
export function useComposedSearch(
  initialValue: string,
  onCommit: (value: string) => void,
  delay = 250,
) {
  const [value, setValue] = useState(initialValue)
  const [isComposing, setIsComposing] = useState(false)
  const commitRef = useRef(onCommit)
  const lastSyncedValue = useRef(initialValue)

  useEffect(() => {
    commitRef.current = onCommit
  }, [onCommit])

  useEffect(() => {
    if (isComposing || initialValue === lastSyncedValue.current) return
    lastSyncedValue.current = initialValue
    setValue(initialValue)
  }, [initialValue, isComposing])

  useEffect(() => {
    if (isComposing || value === initialValue) return
    const timer = window.setTimeout(() => commitRef.current(value), delay)
    return () => window.clearTimeout(timer)
  }, [delay, initialValue, isComposing, value])

  return {
    value,
    onChange: (event: any) => setValue(event.target.value),
    onCompositionStart: () => setIsComposing(true),
    onCompositionEnd: (event: any) => {
      setValue(event.currentTarget.value)
      setIsComposing(false)
    },
  }
}
