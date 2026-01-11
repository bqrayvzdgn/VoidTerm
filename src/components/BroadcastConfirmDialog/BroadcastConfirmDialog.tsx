import React, { useEffect, useCallback } from 'react'
import { useTranslation } from '@/i18n'
import './BroadcastConfirmDialog.css'

interface BroadcastConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const BroadcastConfirmDialog: React.FC<BroadcastConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel
}) => {
  const { t } = useTranslation()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return

    if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Enter') {
      onConfirm()
    }
  }, [open, onCancel, onConfirm])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!open) return null

  return (
    <>
      <div className="dialog-overlay" onClick={onCancel} />
      <div className="broadcast-confirm-dialog">
        <div className="broadcast-confirm-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" strokeLinecap="round" />
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" />
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" strokeLinecap="round" />
            <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="broadcast-confirm-title">{t.broadcast.confirmTitle}</h3>
        <p className="broadcast-confirm-message">{t.broadcast.confirmMessage}</p>
        <div className="broadcast-confirm-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{t.broadcast.warning}</span>
        </div>
        <div className="broadcast-confirm-buttons">
          <button
            className="broadcast-confirm-cancel"
            onClick={onCancel}
          >
            {t.broadcast.cancel}
          </button>
          <button
            className="broadcast-confirm-enable"
            onClick={onConfirm}
            autoFocus
          >
            {t.broadcast.enable}
          </button>
        </div>
      </div>
    </>
  )
}
