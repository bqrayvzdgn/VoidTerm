import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useToastStore } from './toastStore'

describe('toastStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useToastStore.setState({ toasts: [] })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('addToast', () => {
    it('should add a toast to the list', () => {
      const { addToast } = useToastStore.getState()
      
      addToast({ type: 'success', message: 'Test message' })
      
      const { toasts } = useToastStore.getState()
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Test message')
      expect(toasts[0].type).toBe('success')
    })

    it('should auto-remove toast after duration', () => {
      const { addToast } = useToastStore.getState()
      
      addToast({ type: 'info', message: 'Auto remove', duration: 1000 })
      
      expect(useToastStore.getState().toasts).toHaveLength(1)
      
      vi.advanceTimersByTime(1000)
      
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('should not auto-remove when duration is 0', () => {
      const { addToast } = useToastStore.getState()
      
      addToast({ type: 'error', message: 'Persistent', duration: 0 })
      
      vi.advanceTimersByTime(10000)
      
      expect(useToastStore.getState().toasts).toHaveLength(1)
    })

    it('should limit toasts to MAX_TOASTS (5)', () => {
      const { addToast } = useToastStore.getState()
      
      for (let i = 0; i < 7; i++) {
        addToast({ type: 'info', message: `Toast ${i}`, duration: 0 })
      }
      
      const { toasts } = useToastStore.getState()
      expect(toasts).toHaveLength(5)
      expect(toasts[0].message).toBe('Toast 2') // First 2 were removed
      expect(toasts[4].message).toBe('Toast 6')
    })

    it('should return toast id', () => {
      const { addToast } = useToastStore.getState()
      
      const id = addToast({ type: 'success', message: 'Test' })
      
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })
  })

  describe('removeToast', () => {
    it('should remove specific toast by id', () => {
      const { addToast, removeToast } = useToastStore.getState()
      
      const id1 = addToast({ type: 'info', message: 'Toast 1', duration: 0 })
      addToast({ type: 'info', message: 'Toast 2', duration: 0 })
      
      expect(useToastStore.getState().toasts).toHaveLength(2)
      
      removeToast(id1)
      
      const { toasts } = useToastStore.getState()
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Toast 2')
    })

    it('should do nothing when id not found', () => {
      const { addToast, removeToast } = useToastStore.getState()
      
      addToast({ type: 'info', message: 'Toast', duration: 0 })
      
      removeToast('non-existent-id')
      
      expect(useToastStore.getState().toasts).toHaveLength(1)
    })
  })

  describe('clearAll', () => {
    it('should remove all toasts', () => {
      const { addToast, clearAll } = useToastStore.getState()
      
      addToast({ type: 'info', message: 'Toast 1', duration: 0 })
      addToast({ type: 'info', message: 'Toast 2', duration: 0 })
      addToast({ type: 'info', message: 'Toast 3', duration: 0 })
      
      expect(useToastStore.getState().toasts).toHaveLength(3)
      
      clearAll()
      
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })
  })

  describe('convenience methods', () => {
    it('success() should create success toast', () => {
      const { success } = useToastStore.getState()
      
      success('Success message')
      
      const { toasts } = useToastStore.getState()
      expect(toasts[0].type).toBe('success')
      expect(toasts[0].message).toBe('Success message')
    })

    it('error() should create error toast with longer duration', () => {
      const { error } = useToastStore.getState()
      
      error('Error message')
      
      const { toasts } = useToastStore.getState()
      expect(toasts[0].type).toBe('error')
      expect(toasts[0].duration).toBe(6000)
    })

    it('warning() should create warning toast', () => {
      const { warning } = useToastStore.getState()
      
      warning('Warning message')
      
      const { toasts } = useToastStore.getState()
      expect(toasts[0].type).toBe('warning')
    })

    it('info() should create info toast', () => {
      const { info } = useToastStore.getState()
      
      info('Info message')
      
      const { toasts } = useToastStore.getState()
      expect(toasts[0].type).toBe('info')
    })
  })

  describe('toast with action', () => {
    it('should store action in toast', () => {
      const { addToast } = useToastStore.getState()
      const mockAction = vi.fn()
      
      addToast({
        type: 'info',
        message: 'With action',
        action: {
          label: 'Undo',
          onClick: mockAction
        }
      })
      
      const { toasts } = useToastStore.getState()
      expect(toasts[0].action).toBeDefined()
      expect(toasts[0].action?.label).toBe('Undo')
    })
  })
})
