import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FamilyDetail } from '../src/features/family/components/FamilyDetail.tsx'
import { FamilyList } from '../src/features/family/components/FamilyList.tsx'
import { createQueryClient } from '../src/shared/queryClient.ts'

function renderFeature(view: ReactNode, path = '/families') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[path]}>{view}</MemoryRouter>
    </QueryClientProvider>,
  )
}

const zone = { id: 'zone-1', name: 'Giáo họ Thánh Gia' }
const family = {
  id: 'family-1',
  zoneId: zone.id,
  zoneName: zone.name,
  name: 'Hộ Nguyễn',
  address: null,
  note: null,
  memberCount: 1,
  updatedAt: '2026-09-14T00:00:00.000Z',
}

beforeEach(() => {
  window.api = {
    zone: { list: vi.fn(async () => ({ ok: true, data: [zone], meta: { total: 1 } })) },
    family: {
      list: vi.fn(async () => ({ ok: true, data: [family], meta: { total: 1 } })),
      getById: vi.fn(async () => ({
        ok: true,
        data: {
          ...family,
          members: [
            {
              id: 'member-1',
              personId: 'person-1',
              personFullName: 'Nguyễn Văn An',
              relationship: 'head',
              fromDate: '2020-01-01',
            },
          ],
        },
      })),
      create: vi.fn(async () => ({ ok: true, data: family })),
      update: vi.fn(async () => ({ ok: true, data: family })),
      remove: vi.fn(async () => ({ ok: true, data: { id: family.id } })),
    },
    person: {
      list: vi.fn(async () => ({ ok: true, data: [], meta: { total: 0 } })),
    },
    familyMember: {
      add: vi.fn(async () => ({ ok: true, data: {} })),
      update: vi.fn(async () => ({ ok: true, data: {} })),
      move: vi.fn(async () => ({ ok: true, data: {} })),
      remove: vi.fn(async () => ({ ok: true, data: {} })),
    },
  }
})

describe('Gia đình', () => {
  it('tạo hộ với giáo họ được chọn qua preload', async () => {
    const user = userEvent.setup()
    renderFeature(<FamilyList />)
    await user.click(await screen.findByRole('button', { name: 'Thêm gia đình' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Giáo họ' }), zone.id)
    await user.type(screen.getByRole('textbox', { name: 'Tên hộ' }), 'Hộ Trần')
    await user.click(screen.getByRole('button', { name: 'Tạo gia đình' }))
    await waitFor(() =>
      expect(window.api.family.create).toHaveBeenCalledWith({
        zoneId: zone.id,
        name: 'Hộ Trần',
        address: '',
        note: '',
      }),
    )
  })

  it('hiển thị chủ hộ và lỗi xoá khi còn thành viên', async () => {
    const user = userEvent.setup()
    window.api.family.remove.mockResolvedValue({
      ok: false,
      error: { code: 'CONFLICT', message: 'Không thể xoá', details: { memberCount: 1 } },
    })
    renderFeature(<FamilyDetail id={family.id} />, `/families/${family.id}`)
    expect(await screen.findByRole('link', { name: 'Nguyễn Văn An' })).toBeTruthy()
    expect(screen.getByText('Chủ hộ')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Xoá' }))
    await user.click(screen.getByRole('button', { name: 'Xác nhận xoá' }))
    expect(
      await screen.findByText(
        'Gia đình còn 1 thành viên, hãy chuyển những người này sang hộ khác trước.',
      ),
    ).toBeTruthy()
  })

  it('sửa gia đình chỉ gửi các trường cho phép trong patch', async () => {
    const user = userEvent.setup()
    renderFeature(<FamilyDetail id={family.id} />, `/families/${family.id}`)
    await user.click(await screen.findByRole('button', { name: 'Sửa' }))
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(window.api.family.update).toHaveBeenCalledWith({
        id: family.id,
        expectedUpdatedAt: family.updatedAt,
        patch: { zoneId: zone.id, name: family.name, address: '', note: '' },
      }),
    )
  })
})
