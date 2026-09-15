import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useComposedSearch } from '../src/hooks/useComposedSearch.ts'

function SearchInput({ onCommit }: { onCommit: (value: string) => void }) {
  const input = useComposedSearch('', onCommit)
  return <input aria-label="Tìm kiếm" {...input} />
}

describe('useComposedSearch', () => {
  it('chỉ đồng bộ sau khi IME kết thúc composition', () => {
    vi.useFakeTimers()
    const commit = vi.fn()
    render(<SearchInput onCommit={commit} />)
    const input = screen.getByRole('textbox', { name: 'Tìm kiếm' })

    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: 'gia' } })
    act(() => vi.advanceTimersByTime(300))
    expect(commit).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'giá' } })
    fireEvent.compositionEnd(input)
    act(() => vi.advanceTimersByTime(250))
    expect(commit).toHaveBeenLastCalledWith('giá')
    vi.useRealTimers()
  })
})
