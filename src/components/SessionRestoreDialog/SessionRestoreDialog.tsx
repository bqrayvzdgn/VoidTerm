import { useTranslation } from '../../i18n'

interface SessionRestoreDialogProps {
  isOpen: boolean
  tabCount: number
  onRestore: () => void
  onDismiss: () => void
}

export function SessionRestoreDialog({ isOpen, tabCount, onRestore, onDismiss }: SessionRestoreDialogProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="session-restore-overlay" onClick={onDismiss}>
      <div className="session-restore-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{t.session?.restoreTitle || 'Restore Session?'}</h3>
        <p>
          {t.session?.restoreMessage ||
            `You had ${tabCount} tab${tabCount !== 1 ? 's' : ''} open in your last session.`}
        </p>
        <div className="session-restore-actions">
          <button className="session-restore-btn secondary" onClick={onDismiss}>
            {t.session?.startFresh || 'Start Fresh'}
          </button>
          <button className="session-restore-btn primary" onClick={onRestore}>
            {t.session?.restore || 'Restore'}
          </button>
        </div>
      </div>
    </div>
  )
}
