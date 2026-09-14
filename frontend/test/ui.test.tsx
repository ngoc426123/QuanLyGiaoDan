import { createRef, useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Button } from '../src/components/ui/Button.tsx'
import { DateInput } from '../src/components/ui/DateInput.tsx'
import { Input } from '../src/components/ui/Input.tsx'
import { Modal } from '../src/components/ui/Modal.tsx'
import { Drawer } from '../src/components/ui/Drawer.tsx'
import { ConfirmDialog } from '../src/components/ui/ConfirmDialog.tsx'
import { VirtualList } from '../src/components/ui/VirtualList.tsx'
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary.tsx'
import { DirectoryTable } from '../src/features/preview/DirectoryTable.tsx'
import { directories } from '../src/features/preview/sampleData.ts'

function DialogExample({ Component = Modal }) {
  const [isOpen, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Mở</Button>
      {isOpen && (
        <Component title="Chi tiết" onClose={() => setOpen(false)}>
          <Input label="Tên" />
          <Button>Lưu</Button>
        </Component>
      )}
    </>
  )
}

function Crash({ shouldThrow }) {
  if (shouldThrow) throw new Error('Lỗi render thử nghiệm')
  return <p>Nội dung đã trở lại</p>
}

describe('Component dùng chung', () => {
  it('Input nối nhãn/lỗi, chuyển tiếp ref và thuộc tính; Button không chạy khi pending', async () => {
    const ref = createRef()
    const click = vi.fn()
    render(
      <>
        <Input ref={ref} label="Họ tên" error="Thiếu họ tên" required />
        <Button isPending onClick={click}>
          Lưu
        </Button>
      </>,
    )
    expect(screen.getByRole('textbox', { name: 'Họ tên' })).toBe(ref.current)
    expect(ref.current.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id)
    await userEvent.click(screen.getByRole('button'))
    expect(click).not.toHaveBeenCalled()
  })

  it('DateInput giữ chuỗi ngày lịch, kể cả khi xoá', () => {
    const change = vi.fn()
    render(<DateInput label="Ngày sinh" value="2026-09-13" onChange={change} />)
    fireEvent.change(screen.getByLabelText('Ngày sinh'), { target: { value: '2026-01-01' } })
    expect(change).toHaveBeenLastCalledWith('2026-01-01')
    fireEvent.change(screen.getByLabelText('Ngày sinh'), { target: { value: '' } })
    expect(change).toHaveBeenLastCalledWith('')
  })

  it.each([Modal, Drawer])('hộp thoại mở, đóng qua cancel, trả focus về nút', async (Component) => {
    const user = userEvent.setup()
    render(<DialogExample Component={Component} />)
    const trigger = screen.getByRole('button', { name: 'Mở' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Chi tiết' })
    expect(dialog.contains(document.activeElement)).toBe(true)
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).toBe(null)
    expect(document.activeElement).toBe(trigger)
  })

  it('ConfirmDialog không cho đóng hay xác nhận lại khi pending', async () => {
    const close = vi.fn()
    const confirm = vi.fn()
    render(
      <ConfirmDialog onClose={close} onConfirm={confirm} isPending>
        Xoá bản ghi này?
      </ConfirmDialog>,
    )
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.getByRole('button', { name: 'Đóng hộp thoại' }).disabled).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Huỷ' }))
    expect(close).not.toHaveBeenCalled()
    expect(confirm).not.toHaveBeenCalled()
  })

  it('Error Boundary giữ phần ngoài hoạt động và có thể thử lại', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const view = render(
      <>
        <Button>Thanh bên</Button>
        <ErrorBoundary>
          <Crash shouldThrow />
        </ErrorBoundary>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Thanh bên' }).disabled).toBe(false)
    view.rerender(
      <>
        <Button>Thanh bên</Button>
        <ErrorBoundary>
          <Crash shouldThrow={false} />
        </ErrorBoundary>
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(screen.getByText('Nội dung đã trở lại')).toBeTruthy()
  })

  it('danh sách 1000 hàng chỉ dựng vùng nhìn thấy; End/Enter mở hàng cuối', () => {
    const rows = Array.from({ length: 1000 }, (_, index) => ({
      id: `person-${index}`,
      name: `Giáo dân ${index}`,
    }))
    const activate = vi.fn()
    render(
      <VirtualList
        items={rows}
        label="Giáo dân"
        onActivate={activate}
        renderItem={(item) => item.name}
      />,
    )
    expect(screen.getAllByRole('row').length).toBeLessThan(20)
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Enter' })
    expect(activate).toHaveBeenLastCalledWith(rows[0])
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'End' })
    expect(screen.getByText('Giáo dân 999')).toBeTruthy()
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Enter' })
    expect(activate).toHaveBeenCalledWith(rows[999])
  })

  it('bảng hiển thị đủ năm trạng thái, skeleton trễ 150 ms', async () => {
    vi.useFakeTimers()
    const config = directories.persons
    const common = {
      config,
      domain: 'persons',
      rows: config.rows,
      onClear: vi.fn(),
      onRetry: vi.fn(),
    }
    const view = render(
      <MemoryRouter>
        <DirectoryTable {...common} state="loading" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('status').dataset.visible).toBe('false')
    act(() => vi.advanceTimersByTime(150))
    expect(screen.getByRole('status').dataset.visible).toBe('true')
    vi.useRealTimers()
    view.rerender(
      <MemoryRouter>
        <DirectoryTable {...common} state="error" error={{ message: 'Lỗi đọc dữ liệu' }} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(common.onRetry).toHaveBeenCalledOnce()
    view.rerender(
      <MemoryRouter>
        <DirectoryTable {...common} state="empty" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Chưa có dữ liệu' })).toBeTruthy()
    view.rerender(
      <MemoryRouter>
        <DirectoryTable {...common} rows={[]} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xoá bộ lọc' }))
    expect(common.onClear).toHaveBeenCalledOnce()
    view.rerender(
      <MemoryRouter>
        <DirectoryTable {...common} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(6)
  })
})
