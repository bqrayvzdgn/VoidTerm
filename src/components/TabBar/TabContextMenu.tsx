import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Workspace } from '../../types'

const TAB_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280'
]

interface TabContextMenuProps {
  x: number
  y: number
  tabId: string
  currentColor?: string
  isPinned?: boolean
  workspaces: Workspace[]
  onClose: () => void
  onTogglePin: (tabId: string) => void
  onMoveToWorkspace: (workspaceId: string | undefined) => void
  onSetColor: (color: string | undefined) => void
}

export function TabContextMenu({
  x,
  y,
  tabId,
  workspaces,
  currentColor,
  isPinned,
  onClose,
  onTogglePin,
  onMoveToWorkspace,
  onSetColor
}: TabContextMenuProps) {
  const [showColors, setShowColors] = useState(false)

  return createPortal(
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div className="context-menu" style={{ left: x, top: y }}>
        {!showColors ? (
          <>
            <button className="context-menu-item" onClick={() => { onTogglePin(tabId); onClose() }}>
              <span>{isPinned ? 'Unpin Tab' : 'Pin Tab'}</span>
            </button>
            <div className="context-menu-divider" />
            <button className="context-menu-item" onClick={() => setShowColors(true)}>
              <span
                className="context-menu-color-dot"
                style={{ background: currentColor || 'var(--text-muted)' }}
              />
              <span>Set Color</span>
            </button>
            <div className="context-menu-divider" />
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
          </>
        ) : (
          <>
            <div className="context-menu-header">Tab Color</div>
            <div className="context-menu-color-grid">
              {TAB_COLORS.map((color) => (
                <button
                  key={color}
                  className={`context-menu-color-swatch ${currentColor === color ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => {
                    onSetColor(color)
                    onClose()
                  }}
                  title={color}
                />
              ))}
            </div>
            {currentColor && (
              <button
                className="context-menu-item"
                onClick={() => {
                  onSetColor(undefined)
                  onClose()
                }}
              >
                <span>Clear Color</span>
              </button>
            )}
          </>
        )}
      </div>
    </>,
    document.body
  )
}
