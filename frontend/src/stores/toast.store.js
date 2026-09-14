import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toasts: [],
  add: (message, isError = false) =>
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id: crypto.randomUUID(), message, isError }],
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
