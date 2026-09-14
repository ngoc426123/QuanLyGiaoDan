import { create } from 'zustand'

export const useFilterStore = create<any>((set) => ({
  filters: {},
  setFilter: (screen, filter) =>
    set((state) => ({ filters: { ...state.filters, [screen]: filter } })),
  clear: (screen) => set((state) => ({ filters: { ...state.filters, [screen]: undefined } })),
}))
