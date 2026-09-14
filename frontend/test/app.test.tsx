import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App.tsx'
import { useUIStore } from '../src/stores/ui.store.ts'
import { useToastStore } from '../src/stores/toast.store.ts'
import { useFilterStore } from '../src/stores/filter.store.ts'
import { media } from './setup.ts'

let settings
let listener
let windowStateListener
let unsubscribe
beforeEach(() => {
  settings = { 'ui.theme': 'system', 'ui.density': 'comfortable', 'general.language': 'vi' }
  useUIStore.setState({ theme: null, density: null, isSidebarCollapsed: false })
  useToastStore.setState({ toasts: [] })
  useFilterStore.setState({ filters: {} })
  unsubscribe = vi.fn()
  window.api = {
    setting: {
      getAll: vi.fn(async () => ({ ok: true, data: { ...settings } })),
      set: vi.fn(async ({ key, value }) => {
        settings[key] = value
        listener?.({ key })
        return { ok: true, data: { key, value } }
      }),
    },
    events: {
      onSettingChanged: vi.fn((callback) => {
        listener = callback
        return unsubscribe
      }),
      onWindowStateChanged: vi.fn((callback) => {
        windowStateListener = callback
        return vi.fn()
      }),
      onZoneChanged: vi.fn((callback) => {
        void callback
        return vi.fn()
      }),
      onFamilyChanged: vi.fn((callback) => {
        void callback
        return vi.fn()
      }),
      onPersonChanged: vi.fn((callback) => {
        void callback
        return vi.fn()
      }),
    },
    app: {
      closeWindow: vi.fn(async () => ({ ok: true, data: { closed: true } })),
      minimizeWindow: vi.fn(async () => ({ ok: true, data: { minimized: true } })),
      toggleMaximize: vi.fn(async () => ({ ok: true, data: { maximized: true } })),
      getWindowState: vi.fn(async () => ({ ok: true, data: { maximized: false } })),
    },
    backup: {
      exportToFile: vi.fn(async () => ({ ok: true, data: { canceled: true } })),
      importFromFile: vi.fn(async () => ({ ok: true, data: { canceled: true } })),
    },
    dashboard: {
      getSummary: vi.fn(async () => ({
        ok: true,
        data: {
          livingPersonCount: 1,
          familyCount: 1,
          zoneCount: 1,
          zones: [],
          familiesWithoutHead: [],
          personsWithoutFamily: [],
        },
      })),
    },
    zone: {
      list: vi.fn(async () => ({
        ok: true,
        data: {
          data: [
            {
              id: 'zone-1',
              name: 'Giáo họ Thánh Gia',
              holyName: 'Thánh Gia',
              note: null,
              familyCount: 0,
              personCount: 0,
              updatedAt: '2026-09-14T00:00:00.000Z',
            },
          ],
          meta: { total: 1, page: 1, pageSize: 50 },
        },
      })),
      getById: vi.fn(async () => ({
        ok: true,
        data: {
          id: 'zone-1',
          name: 'Giáo họ Thánh Gia',
          holyName: 'Thánh Gia',
          note: null,
          familyCount: 0,
          personCount: 0,
          updatedAt: '2026-09-14T00:00:00.000Z',
        },
      })),
      create: vi.fn(async () => ({ ok: true, data: {} })),
      update: vi.fn(async () => ({ ok: true, data: {} })),
      remove: vi.fn(async () => ({ ok: true, data: {} })),
    },
    family: {
      list: vi.fn(async () => ({
        ok: true,
        data: {
          data: [
            {
              id: 'family-1',
              zoneId: 'zone-1',
              zoneName: 'Giáo họ Thánh Gia',
              name: 'Hộ Nguyễn',
              address: null,
              note: null,
              memberCount: 0,
              updatedAt: '2026-09-14T00:00:00.000Z',
            },
          ],
          meta: { total: 1, page: 1, pageSize: 50 },
        },
      })),
      getById: vi.fn(async () => ({
        ok: true,
        data: {
          id: 'family-1',
          zoneId: 'zone-1',
          zoneName: 'Giáo họ Thánh Gia',
          name: 'Hộ Nguyễn',
          address: null,
          note: null,
          members: [],
          updatedAt: '2026-09-14T00:00:00.000Z',
        },
      })),
      create: vi.fn(async () => ({ ok: true, data: {} })),
      update: vi.fn(async () => ({ ok: true, data: {} })),
      remove: vi.fn(async () => ({ ok: true, data: {} })),
    },
    person: {
      list: vi.fn(async () => ({
        ok: true,
        data: {
          data: [
            {
              id: 'person-1',
              fullName: 'Nguyễn Văn An',
              holyName: 'Giuse',
              gender: 'male',
              birthDate: '1990-01-01',
              familyName: 'Hộ Nguyễn',
              zoneName: 'Giáo họ Thánh Gia',
              updatedAt: '2026-09-14T00:00:00.000Z',
            },
          ],
          meta: { total: 1, page: 1, pageSize: 50 },
        },
      })),
      getById: vi.fn(async () => ({
        ok: true,
        data: {
          id: 'person-1',
          fullName: 'Nguyễn Văn An',
          holyName: 'Giuse',
          gender: 'male',
          birthDate: '1990-01-01',
          currentMembership: null,
          membershipHistory: [],
          updatedAt: '2026-09-14T00:00:00.000Z',
        },
      })),
      create: vi.fn(async () => ({ ok: true, data: {} })),
      update: vi.fn(async () => ({ ok: true, data: {} })),
      remove: vi.fn(async () => ({ ok: true, data: {} })),
    },
  }
})

describe('Khung ứng dụng qua API preload', () => {
  it('menu khung gọi được lệnh thật và đồng bộ nút phóng to', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Tệp' }))
    await user.click(screen.getByRole('menuitem', { name: 'Cài đặt' }))
    expect(await screen.findByRole('combobox', { name: 'Chế độ giao diện' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Xem' }))
    await user.click(screen.getByRole('menuitem', { name: 'Thu gọn hoặc mở rộng thanh bên' }))
    expect(screen.getByRole('main').closest('[data-collapsed]').dataset.collapsed).toBe('true')
    await user.click(screen.getByRole('button', { name: 'Phóng to cửa sổ' }))
    expect(window.api.app.toggleMaximize).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Khôi phục cửa sổ' })).toBeTruthy()
    act(() => windowStateListener({ maximized: false }))
    expect(screen.getByRole('button', { name: 'Phóng to cửa sổ' })).toBeTruthy()
  })
  it('trang giáo dân dùng dữ liệu thật mà vẫn điều hướng được từ App Shell', async () => {
    window.location.hash = '/persons'
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Giáo dân', exact: true })).toBeTruthy()
    await userEvent.click(
      within(screen.getByRole('navigation')).getByRole('link', { name: 'Gia đình' }),
    )
    expect(screen.getByRole('heading', { name: 'Gia đình', exact: true })).toBeTruthy()
  })
  it('đi đủ 10 route, trang chi tiết đánh dấu đúng mục cha', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Tổng quan giáo xứ' })).toBeTruthy()
    for (const [label, detail] of [
      ['Giáo dân', 'Hồ sơ giáo dân'],
      ['Gia đình', 'Chi tiết hộ'],
      ['Giáo họ', 'Chi tiết giáo họ'],
    ]) {
      await user.click(within(screen.getByRole('navigation')).getByRole('link', { name: label }))
      await user.click(within(screen.getByRole('table')).getAllByRole('link')[0])
      expect(screen.getByRole('heading', { name: detail })).toBeTruthy()
      expect(
        within(screen.getByRole('navigation'))
          .getByRole('link', { name: label })
          .getAttribute('aria-current'),
      ).toBe('page')
    }
    await user.type(
      screen.getByRole('searchbox', { name: 'Tìm kiếm toàn bộ danh bạ' }),
      'nguyen{Enter}',
    )
    expect(await screen.findByRole('heading', { name: 'Tìm kiếm' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Nguyễn Văn An' })).toBeTruthy()
    await user.click(screen.getByRole('link', { name: 'Thùng rác' }))
    expect(screen.getByRole('heading', { name: 'Thùng rác đang trống' })).toBeTruthy()
    await user.click(screen.getByRole('link', { name: 'Cài đặt' }))
    expect(await screen.findByRole('combobox', { name: 'Chế độ giao diện' })).toBeTruthy()
  })

  it('lọc giáo dân được phản ánh vào URL', async () => {
    const user = userEvent.setup()
    window.location.hash = '/persons'
    render(<App />)
    await user.type(screen.getByRole('textbox', { name: 'Tìm trong danh sách' }), 'nguyen')
    await waitFor(() => expect(window.location.hash).toContain('q=nguyen'))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Giới tính' }), 'male')
    await waitFor(() => expect(window.location.hash).toContain('gender=male'))
  })

  it('lưu theme, khởi động lại, phản ứng với hệ thống và huỷ listener', async () => {
    const user = userEvent.setup()
    window.location.hash = '/settings'
    const view = render(<App />)
    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Chế độ giao diện' }),
      'dark',
    )
    await waitFor(() => expect(localStorage.getItem('elecrusion.theme')).toBe('dark'))
    expect(document.documentElement.dataset.theme).toBe('dark')
    view.unmount()
    expect(unsubscribe).toHaveBeenCalledOnce()
    render(<App />)
    expect((await screen.findByRole('combobox', { name: 'Chế độ giao diện' })).value).toBe('dark')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Chế độ giao diện' }), 'system')
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'))
    act(() => {
      media.matches = true
      media.dispatchEvent(new Event('change'))
    })
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('lưu thất bại trả theme cũ, hiện đúng thông điệp từ Main', async () => {
    const user = userEvent.setup()
    window.api.setting.set.mockResolvedValue({
      ok: false,
      error: { code: 'IO_ERROR', message: 'Không ghi được cấu hình thử nghiệm' },
    })
    window.location.hash = '/settings'
    render(<App />)
    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Chế độ giao diện' }),
      'dark',
    )
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'))
    expect(screen.getByRole('alert').textContent).toContain('Không ghi được cấu hình thử nghiệm')
    expect(localStorage.getItem('elecrusion.theme')).toBe('system')
  })

  it('khoá cả hai nút dữ liệu trong một mutation, không gọi lần hai', async () => {
    const user = userEvent.setup()
    let finish
    window.api.backup.exportToFile.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    window.location.hash = '/settings'
    render(<App />)
    const button = screen.getByRole('button', { name: 'Xuất dữ liệu ra file' })
    await user.dblClick(button)
    expect(window.api.backup.exportToFile).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Nhập dữ liệu từ file' }).disabled).toBe(true)
    await act(async () => finish({ ok: true, data: { canceled: true } }))
    await waitFor(() => expect(button.disabled).toBe(false))
  })

  it('phím tắt không chạy khi đang nhập', async () => {
    render(<App />)
    fireEvent.keyDown(document.body, { key: 'b', ctrlKey: true })
    expect(screen.getByRole('main').closest('[data-collapsed]').dataset.collapsed).toBe('true')
    fireEvent.keyDown(document.body, { key: 'f', ctrlKey: true })
    const search = screen.getByRole('searchbox', { name: 'Tìm kiếm toàn bộ danh bạ' })
    expect(document.activeElement).toBe(search)
    fireEvent.keyDown(search, { key: 'b', ctrlKey: true })
    expect(screen.getByRole('main').closest('[data-collapsed]').dataset.collapsed).toBe('true')
  })

  it('ô tìm kiếm khôi phục từ URL và xoá cùng bộ lọc', async () => {
    window.location.hash = '/search?q=khongco'
    render(<App />)
    expect(screen.getByRole('searchbox', { name: 'Tìm kiếm toàn bộ danh bạ' }).value).toBe(
      'khongco',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Xoá bộ lọc' }))
    expect(screen.getByRole('searchbox', { name: 'Tìm kiếm toàn bộ danh bạ' }).value).toBe('')
  })

  it('rời Cài đặt khi đang lưu không giữ lại bản xem trước bị lỗi', async () => {
    let finish
    window.api.setting.set.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    window.location.hash = '/settings'
    render(<App />)
    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Chế độ giao diện' }),
      'dark',
    )
    await userEvent.click(screen.getByRole('navigation').querySelector('a[href="#/"]'))
    expect(document.documentElement.dataset.theme).toBe('dark')
    await act(async () =>
      finish({ ok: false, error: { code: 'IO_ERROR', message: 'Không lưu được' } }),
    )
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'))
  })

  it('lỗi đọc cấu hình có thể thử lại, sidebar vẫn dùng được', async () => {
    window.api.setting.getAll.mockResolvedValueOnce({
      ok: false,
      error: { code: 'DB_ERROR', message: 'Không đọc được cấu hình' },
    })
    window.location.hash = '/settings'
    render(<App />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('combobox', { name: 'Chế độ giao diện' })).toBeTruthy()
  })
})
