import React, { memo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type Toast as ToastType, type ToastType as ToastVariant } from '../../store/toastStore'

/**
 * Returns the icon for a toast type
 */
const ToastIcon: React.FC<{ type: ToastVariant }> = memo(({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={16} strokeWidth={1.5} />
    case 'error':
      return <XCircle size={16} strokeWidth={1.5} />
    case 'warning':
      return <AlertTriangle size={16} strokeWidth={1.5} />
    case 'info':
      return <Info size={16} strokeWidth={1.5} />
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
      <button className="toast-close" onClick={handleClose} aria-label="Close notification">
        <X size={12} strokeWidth={1.5} />
      </button>
    </div>
  )
})

ToastItem.displayName = 'ToastItem'

/**
 * Toast Container - Renders all active toasts
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
