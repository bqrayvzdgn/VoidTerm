import { createPortal } from 'react-dom'
import type { Workspace } from '../../types'

interface TabContextMenuProps {
  x: number
  y: number
  tabId: string
  workspaces: Workspace[]
  onClose: () => void
  onMoveToWorkspace: (workspaceId: string | undefined) => void
}

export function TabContextMenu({ x, y, workspaces, onClose, onMoveToWorkspace }: TabContextMenuProps) {
  return createPortal(
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div className="context-menu" style={{ left: x, top: y }}>
        <div className="context-menu-header">Move to Workspace</div>
        <button className="context-menu-item" onClick={() => onMoveToWorkspace(undefined)}>
          <span className="context-menu-icon none">—</span>
          <span>No Workspace</span>
        </button>
        {workspaces.map((workspace) => (
          <button key={workspace.id} className="context-menu-item" onClick={() => onMoveToWorkspace(workspace.id)}>
            <span>{workspace.name}</span>
          </button>
        ))}
      </div>
    </>,
    document.body
  )
}
