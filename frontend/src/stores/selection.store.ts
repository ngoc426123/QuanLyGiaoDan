import { create } from 'zustand'

const EMPTY_IDS: string[] = []

export const useSelectionStore = create<any>((set) => ({
  scope: null,
  ids: [],
  toggle: (scope, id) =>
    set((state) => ({
      scope,
      ids:
        state.scope === scope && state.ids.includes(id)
          ? state.ids.filter((item) => item !== id)
          : state.scope === scope
            ? [...state.ids, id]
            : [id],
    })),
  clear: (scope) => set((state) => (state.scope === scope ? { ids: [], scope: null } : state)),
}))

export const selectedIdsFor = (scope: string) => (state: any) =>
  state.scope === scope ? state.ids : EMPTY_IDS
