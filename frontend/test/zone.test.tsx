import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZoneDetail } from '../src/features/zone/components/ZoneDetail.tsx'
import { ZoneList } from '../src/features/zone/components/ZoneList.tsx'
import { createQueryClient } from '../src/shared/queryClient.ts'

function renderFeature(view: ReactNode, path = '/zones') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[path]}>{view}</MemoryRouter>
    </QueryClientProvider>,
  )
}

const zone = {
  id: 'zone-1',
  name: 'Giáo họ Thánh Gia',
  holyName: 'Thánh Gia',
  note: null,
  familyCount: 1,
  personCount: 2,
  updatedAt: '2026-09-14T00:00:00.000Z',
}

beforeEach(() => {
  window.api = {
    zone: {
      list: vi.fn(async () => ({ ok: true, data: { data: [zone], meta: { total: 1 } } })),
      getById: vi.fn(async () => ({ ok: true, data: zone })),
      create: vi.fn(async () => ({ ok: true, data: zone })),
      update: vi.fn(async () => ({ ok: true, data: zone })),
      remove: vi.fn(async () => ({ ok: true, data: { id: zone.id } })),
    },
    family: {
      list: vi.fn(async () => ({
        ok: true,
        data: {
          data: [{ id: 'family-1', name: 'Hộ Nguyễn', address: null, memberCount: 2 }],
          meta: { total: 1 },
        },
      })),
    },
    events: { onZoneChanged: vi.fn(() => vi.fn()) },
  }
})

describe('Giáo họ', () => {
  it('tạo giáo họ từ danh sách và gửi dữ liệu qua preload', async () => {
    const user = userEvent.setup()
    renderFeature(<ZoneList />)
    await user.click(await screen.findByRole('button', { name: 'Thêm giáo họ' }))
    await user.type(screen.getByRole('textbox', { name: 'Tên giáo họ' }), 'Giáo họ Mân Côi')
    await user.click(screen.getByRole('button', { name: 'Tạo giáo họ' }))
    await waitFor(() =>
      expect(window.api.zone.create).toHaveBeenCalledWith({
        name: 'Giáo họ Mân Côi',
        holyName: '',
        note: '',
      }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('hiển thị các hộ thuộc giáo họ và báo rõ khi không thể xoá', async () => {
    const user = userEvent.setup()
    window.api.zone.remove.mockResolvedValue({
      ok: false,
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Không thể xoá',
        details: { familyCount: 1 },
      },
    })
    renderFeature(<ZoneDetail id={zone.id} />, `/zones/${zone.id}`)
    expect(await screen.findByRole('link', { name: 'Hộ Nguyễn' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Xoá' }))
    await user.click(screen.getByRole('button', { name: 'Xác nhận xoá' }))
    expect(
      await screen.findByText('Giáo họ còn 1 gia đình, hãy chuyển sang giáo họ khác trước.'),
    ).toBeTruthy()
  })
})
