import { create } from 'zustand'

const TOAST_DURATION_MS = 3000

export const useToastStore = create<any>((set) => ({
  toasts: [],
  add: (message, isError = false) => {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message, isError }],
    }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast: any) => toast.id !== id) }))
    }, TOAST_DURATION_MS)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
