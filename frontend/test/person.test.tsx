import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditPersonPage } from '../src/features/person/components/PersonFormPage.tsx'
import { createQueryClient } from '../src/shared/queryClient.ts'

const person = {
  id: 'person-1',
  fullName: 'Nguyen Van An',
  fullNameAscii: 'nguyen van an',
  givenName: null,
  holyName: 'Giuse',
  gender: 'male',
  birthDate: '1990-01-01',
  phone: null,
  email: null,
  occupation: null,
  secondaryPhone: null,
  residenceStatus: null,
  pastoralStatus: null,
  pastoralNote: null,
  source: null,
  sacraments: [],
  marriage: null,
  note: null,
  currentMembership: null,
  membershipHistory: [],
  familyId: 'family-1',
  updatedAt: '2026-09-14T00:00:00.000Z',
}

beforeEach(() => {
  window.api = {
    person: {
      list: vi.fn(async () => ({ ok: true, data: [], meta: { total: 0 } })),
      getById: vi.fn(async () => ({ ok: true, data: person })),
      create: vi.fn(async () => ({
        ok: true,
        data: {
          id: 'external-parent-1',
          personType: 'external',
          holyName: 'Maria',
          fullName: 'Trần Thị Bình',
          parishName: 'Giáo xứ Bình An',
          dioceseName: 'Giáo phận Xuân Lộc',
        },
      })),
      update: vi.fn(async () => ({ ok: true, data: person })),
      remove: vi.fn(async () => ({ ok: true, data: { id: person.id } })),
    },
    family: { list: vi.fn(async () => ({ ok: true, data: [], meta: { total: 0 } })) },
    familyMember: { move: vi.fn() },
    activityLog: { list: vi.fn(async () => ({ ok: true, data: [] })) },
  }
})

describe('Giáo dân', () => {
  it('sửa giáo dân chỉ gửi các trường cho phép trong patch', async () => {
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={[`/persons/${person.id}/edit`]}>
          <Routes>
            <Route path="/persons/:id/edit" element={<EditPersonPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(
      await screen.findByRole('heading', { name: 'Thông tin định danh & Hành chính' }),
    ).toBeTruthy()
    expect(screen.queryByLabelText('Tình trạng hôn phối')).toBeNull()
    await user.click(await screen.findByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() =>
      expect(window.api.person.update).toHaveBeenCalledWith({
        id: person.id,
        expectedUpdatedAt: person.updatedAt,
        patch: {
          fullName: person.fullName,
          givenName: null,
          holyName: person.holyName,
          gender: person.gender,
          birthDate: person.birthDate,
          phone: null,
          email: null,
          occupation: null,
          secondaryPhone: null,
          residenceStatus: null,
          pastoralStatus: null,
          pastoralNote: null,
          source: null,
          sacraments: [],
          deathDate: null,
          note: null,
          personType: 'parish',
          parishName: null,
          dioceseName: null,
          parents: {
            fatherId: null,
            motherId: null,
            fatherExternalName: null,
            motherExternalName: null,
          },
        },
      }),
    )
  })

  it('thêm nhanh cha ngoài xứ giữ nguyên form giáo dân và gán hồ sơ vừa tạo', async () => {
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={[`/persons/${person.id}/edit`]}>
          <Routes>
            <Route path="/persons/:id/edit" element={<EditPersonPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    const parentType = (await screen.findAllByRole('combobox', { name: 'Loại hồ sơ' }))[0]
    await user.click(parentType)
    await user.click(await screen.findByRole('option', { name: 'Ngoài giáo xứ' }))
    await user.click(await screen.findByRole('button', { name: 'Thêm người ngoài xứ' }))
    const modal = screen.getByRole('dialog')
    await user.type(within(modal).getByRole('textbox', { name: 'Họ và tên' }), 'Trần Thị Bình')
    await user.click(within(modal).getByRole('button', { name: 'Lưu người ngoài xứ' }))

    await screen.findByText('Đã thêm: Maria Trần Thị Bình')
    expect(screen.getByText('Giáo xứ: Giáo xứ Bình An | Giáo phận: Giáo phận Xuân Lộc')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Sửa giáo dân' })).toBeTruthy()
    expect(window.api.person.update).not.toHaveBeenCalled()
    expect(window.api.person.create).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Trần Thị Bình', personType: 'external' }),
    )
  })
})
