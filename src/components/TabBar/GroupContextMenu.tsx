import { createPortal } from 'react-dom'
import { Pencil, Trash2 } from 'lucide-react'
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
            <Pencil size={12} strokeWidth={1.5} />
          </span>
          <span>{t.tabbar.renameGroup}</span>
        </button>
        <button className="context-menu-item danger" onClick={onDelete}>
          <span className="context-menu-icon delete">
            <Trash2 size={12} strokeWidth={1.5} />
          </span>
          <span>{t.tabbar.deleteGroup}</span>
        </button>
      </div>
    </>,
    document.body
  )
}
