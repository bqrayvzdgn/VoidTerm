import React, { memo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useToastStore, type Toast as ToastType, type ToastType as ToastVariant } from '../../store/toastStore'

/**
 * Toast ikonlarını döndürür
 */
const ToastIcon: React.FC<{ type: ToastVariant }> = memo(({ type }) => {
  switch (type) {
    case 'success':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8.5L6.5 12L13 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'error':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v4M8 11v.5" strokeLinecap="round" />
        </svg>
      )
    case 'warning':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 2L14 13H2L8 2Z" strokeLinejoin="round" />
          <path d="M8 6v3M8 11v.5" strokeLinecap="round" />
        </svg>
      )
    case 'info':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 7v4M8 5v.5" strokeLinecap="round" />
        </svg>
      )
  }
})

ToastIcon.displayName = 'ToastIcon'

/**
 * Tek bir Toast item
 */
const ToastItem: React.FC<{ toast: ToastType }> = memo(({ toast }) => {
  const removeToast = useToastStore((state) => state.removeToast)

  const handleClose = useCallback(() => {
    removeToast(toast.id)
  }, [removeToast, toast.id])

  const handleAction = useCallback(() => {
    toast.action?.onClick()
    removeToast(toast.id)
  }, [removeToast, toast])

  return (
    <div className={`toast toast-${toast.type}`} role="alert" aria-live="polite">
      <div className="toast-icon">
        <ToastIcon type={toast.type} />
      </div>
      <div className="toast-content">
        <span className="toast-message">{toast.message}</span>
        {toast.action && (
          <button className="toast-action" onClick={handleAction}>
            {toast.action.label}
          </button>
        )}
      </div>
      <button 
        className="toast-close" 
        onClick={handleClose}
        aria-label="Close notification"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2L10 10M10 2L2 10" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
})

ToastItem.displayName = 'ToastItem'

/**
 * Toast Container - Tüm toastları gösterir
 */
export const ToastContainer: React.FC = memo(() => {
  const toasts = useToastStore((state) => state.toasts)

  if (toasts.length === 0) return null

  return createPortal(
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body
  )
})

ToastContainer.displayName = 'ToastContainer'
