import { createPortal } from 'react-dom'
import { useTranslation } from '../../i18n'

interface GroupContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onRename: () => void
  onDelete: () => void
}

export function GroupContextMenu({
  x,
  y,
  onClose,
  onRename,
  onDelete
}: GroupContextMenuProps) {
  const { t } = useTranslation()

  return createPortal(
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div
        className="context-menu"
        style={{ left: x, top: y }}
      >
        <button className="context-menu-item" onClick={onRename}>
          <span className="context-menu-icon edit">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>{t.tabbar.renameGroup}</span>
        </button>
        <button className="context-menu-item danger" onClick={onDelete}>
          <span className="context-menu-icon delete">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M2 3H10M4 3V2H8V3M5 5V9M7 5V9M3 3L4 10H8L9 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>{t.tabbar.deleteGroup}</span>
        </button>
      </div>
    </>,
    document.body
  )
}
