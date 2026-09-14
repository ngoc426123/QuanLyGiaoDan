import { create } from 'zustand'

function readSidebar() {
  try {
    return JSON.parse(localStorage.getItem('elecrusion.sidebar')) || {}
  } catch {
    return {}
  }
}

function saveSidebar(state) {
  try {
    localStorage.setItem(
      'elecrusion.sidebar',
      JSON.stringify({
        sidebarWidth: state.sidebarWidth,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    )
  } catch {
    /* Tuỳ chọn từng máy: vẫn dùng được khi ổ đĩa không cho ghi cache. */
  }
}

const sidebar = readSidebar()
export const useUIStore = create((set, get) => ({
  // Theme/density thật nằm trong Query cache; store chỉ giữ lựa chọn tạm đang xem trước.
  theme: null,
  density: null,
  sidebarWidth: Number.isFinite(sidebar.sidebarWidth)
    ? Math.max(220, Math.min(320, sidebar.sidebarWidth))
    : 260,
  isSidebarCollapsed: sidebar.isSidebarCollapsed === true,
  setPreview: (key, value) => set({ [key]: value }),
  toggleSidebar: () => {
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }))
    saveSidebar(get())
  },
  setSidebarWidth: (width) => {
    set({ sidebarWidth: Math.max(220, Math.min(320, width)) })
    saveSidebar(get())
  },
}))
