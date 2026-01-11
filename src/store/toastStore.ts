import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
  
  // Convenience methods
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
}

const DEFAULT_DURATION = 4000
const MAX_TOASTS = 5

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID()
    const duration = toast.duration ?? DEFAULT_DURATION

    set((state) => {
      // En fazla MAX_TOASTS kadar toast göster
      const newToasts = [...state.toasts, { ...toast, id, duration }]
      if (newToasts.length > MAX_TOASTS) {
        newToasts.shift()
      }
      return { toasts: newToasts }
    })

    // Auto-remove after duration (0 = persistent)
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }

    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
  },

  clearAll: () => {
    set({ toasts: [] })
  },

  // Convenience methods
  success: (message, duration) => {
    return get().addToast({ type: 'success', message, duration })
  },

  error: (message, duration) => {
    return get().addToast({ type: 'error', message, duration: duration ?? 6000 })
  },

  warning: (message, duration) => {
    return get().addToast({ type: 'warning', message, duration })
  },

  info: (message, duration) => {
    return get().addToast({ type: 'info', message, duration })
  }
}))
