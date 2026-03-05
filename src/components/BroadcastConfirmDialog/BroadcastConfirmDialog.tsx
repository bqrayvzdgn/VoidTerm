import React, { useEffect, useCallback } from 'react'
import { Radio, AlertTriangle } from 'lucide-react'
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
          <Radio size={32} strokeWidth={1.5} />
        </div>
        <h3 className="broadcast-confirm-title">{t.broadcast.confirmTitle}</h3>
        <p className="broadcast-confirm-message">{t.broadcast.confirmMessage}</p>
        <div className="broadcast-confirm-warning">
          <AlertTriangle size={16} strokeWidth={1.5} />
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
