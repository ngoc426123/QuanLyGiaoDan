import { create } from 'zustand'

export const useSelectionStore = create<any>((set) => ({
  ids: [],
  toggle: (id) =>
    set((state) => ({
      ids: state.ids.includes(id) ? state.ids.filter((item) => item !== id) : [...state.ids, id],
    })),
  clear: () => set({ ids: [] }),
}))
