import { create } from 'zustand'

export const useOverlayStore = create((set) => ({
  stack: [],
  open: (overlay) =>
    set((state) => ({ stack: [...state.stack, { ...overlay, id: crypto.randomUUID() }] })),
  close: () => set((state) => ({ stack: state.stack.slice(0, -1) })),
  clear: () => set({ stack: [] }),
}))
