import { createPortal } from 'react-dom'
import { useTranslation } from '../../i18n'
import type { TabGroup, Workspace } from '../../types'

interface TabContextMenuProps {
  x: number
  y: number
  tabId: string
  tabGroupId?: string
  tabGroups: TabGroup[]
  workspaces: Workspace[]
  onClose: () => void
  onCreateGroup: () => void
  onAddToGroup: (groupId: string) => void
  onRemoveFromGroup: () => void
  onMoveToWorkspace: (workspaceId: string | undefined) => void
}

export function TabContextMenu({
  x,
  y,
  tabGroupId,
  tabGroups,
  workspaces,
  onClose,
  onCreateGroup,
  onAddToGroup,
  onRemoveFromGroup,
  onMoveToWorkspace
}: TabContextMenuProps) {
  const { t } = useTranslation()

  return createPortal(
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div
        className="context-menu"
        style={{ left: x, top: y }}
      >
        <div className="context-menu-header">{t.tabbar.addToGroup}</div>

        <button className="context-menu-item" onClick={onCreateGroup}>
          <span className="context-menu-icon add">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <span>{t.tabbar.createGroup}</span>
        </button>

        {tabGroups.map(group => (
          <button
            key={group.id}
            className="context-menu-item"
            onClick={() => onAddToGroup(group.id)}
          >
            <span className="context-menu-icon" style={{ backgroundColor: group.color }}>
              G
            </span>
            <span>{group.name}</span>
          </button>
        ))}

        {tabGroupId && (
          <>
            <div className="context-menu-divider" />
            <button className="context-menu-item" onClick={onRemoveFromGroup}>
              <span className="context-menu-icon none">—</span>
              <span>{t.tabbar.removeFromGroup}</span>
            </button>
          </>
        )}

        <div className="context-menu-divider" />
        <div className="context-menu-header">Move to Workspace</div>
        <button
          className="context-menu-item"
          onClick={() => onMoveToWorkspace(undefined)}
        >
          <span className="context-menu-icon none">—</span>
          <span>No Workspace</span>
        </button>
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            className="context-menu-item"
            onClick={() => onMoveToWorkspace(workspace.id)}
          >
            <span
              className="context-menu-icon"
              style={{ backgroundColor: workspace.color }}
            >
              {workspace.icon}
            </span>
            <span>{workspace.name}</span>
          </button>
        ))}
      </div>
    </>,
    document.body
  )
}
