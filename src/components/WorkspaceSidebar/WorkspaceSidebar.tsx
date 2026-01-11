import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useTerminalStore } from '../../store/terminalStore'
import { useSettingsStore } from '../../store/settingsStore'
import { TerminalIcon } from '../Icons/TerminalIcons'

interface WorkspaceSidebarProps {
  expanded: boolean
  onNewTab: (profileId?: string) => void
  onCreateTerminal: (profileId?: string, workspaceId?: string) => void
  onOpenSettings: () => void
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  expanded,
  onNewTab,
  onCreateTerminal,
  onOpenSettings
}) => {
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    removeWorkspace,
    updateWorkspace
  } = useWorkspaceStore()
  const { tabs, activeTabId, setActiveTab, removeTab, updateTab } = useTerminalStore()
  const { profiles } = useSettingsStore()

  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set([activeWorkspaceId || '']))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<'workspace' | 'terminal' | null>(null)
  const [editName, setEditName] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: 'workspace' | 'terminal'
    id: string
  } | null>(null)
  const [colorPicker, setColorPicker] = useState<string | null>(null)
  const [profileDropdownId, setProfileDropdownId] = useState<string | null>(null) // 'header' or workspace id
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const workspaceColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#78716c'
  ]

  const handleChangeColor = (color: string) => {
    if (contextMenu && contextMenu.type === 'workspace') {
      updateWorkspace(contextMenu.id, { color })
    }
    setColorPicker(null)
    setContextMenu(null)
  }

  const handleAddTerminalToWorkspace = () => {
    if (contextMenu && contextMenu.type === 'workspace') {
      onCreateTerminal(undefined, contextMenu.id)
    }
    setContextMenu(null)
  }

  const getProfile = (profileId: string) => {
    return profiles.find(p => p.id === profileId) || profiles[0]
  }

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces(prev => {
      const next = new Set(prev)
      if (next.has(workspaceId)) {
        next.delete(workspaceId)
      } else {
        next.add(workspaceId)
      }
      return next
    })
  }

  const handleWorkspaceClick = (workspaceId: string) => {
    if (activeWorkspaceId === workspaceId) {
      setActiveWorkspace(null)
    } else {
      setActiveWorkspace(workspaceId)
      if (!expandedWorkspaces.has(workspaceId)) {
        toggleWorkspace(workspaceId)
      }
    }
  }

  const handleTerminalClick = (tabId: string, workspaceId?: string) => {
    // Switch to the terminal's workspace (or null for unassigned)
    if (workspaceId !== activeWorkspaceId) {
      setActiveWorkspace(workspaceId || null)
    }
    setActiveTab(tabId)
  }

  const handleContextMenu = (e: React.MouseEvent, type: 'workspace' | 'terminal', id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, type, id })
  }

  const handleRename = () => {
    if (contextMenu) {
      if (contextMenu.type === 'workspace') {
        const workspace = workspaces.find((w) => w.id === contextMenu.id)
        if (workspace) {
          setEditingId(contextMenu.id)
          setEditingType('workspace')
          setEditName(workspace.name)
        }
      } else if (contextMenu.type === 'terminal') {
        const tab = tabs.find((t) => t.id === contextMenu.id)
        if (tab) {
          setEditingId(contextMenu.id)
          setEditingType('terminal')
          setEditName(tab.title)
        }
      }
    }
    setContextMenu(null)
  }

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      if (editingType === 'workspace') {
        updateWorkspace(id, { name: editName.trim() })
      } else if (editingType === 'terminal') {
        updateTab(id, { title: editName.trim() })
      }
    }
    setEditingId(null)
    setEditingType(null)
    setEditName('')
  }

  const handleDelete = () => {
    if (contextMenu) {
      if (contextMenu.type === 'workspace') {
        removeWorkspace(contextMenu.id)
      } else if (contextMenu.type === 'terminal') {
        removeTab(contextMenu.id)
      }
    }
    setContextMenu(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(id)
    } else if (e.key === 'Escape') {
      setEditingId(null)
      setEditingType(null)
      setEditName('')
    }
  }

  if (!expanded) return null

  return (
    <>
      <aside className="workspace-sidebar" role="complementary" aria-label="Workspace Explorer">
        {/* Header */}
        <div className="workspace-sidebar-header">
          <span className="workspace-sidebar-title" id="sidebar-title">Explorer</span>
          <button
            className="workspace-sidebar-add"
            onClick={() => onNewTab()}
            title="New"
            aria-label="Create new workspace or terminal"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tree View */}
        <nav className="workspace-tree" role="tree" aria-labelledby="sidebar-title">
          {/* Workspaces with their terminals */}
          {workspaces.map((workspace) => {
            const isActive = workspace.id === activeWorkspaceId
            const isExpanded = expandedWorkspaces.has(workspace.id)
            const workspaceTabs = tabs.filter(t => t.workspaceId === workspace.id)

            return (
              <div key={workspace.id} className="workspace-tree-section" role="treeitem" aria-expanded={isExpanded}>
                <div
                  className={`workspace-tree-section-header clickable ${isActive ? 'active' : ''}`}
                  onClick={() => handleWorkspaceClick(workspace.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'workspace', workspace.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Workspace: ${workspace.name}, ${workspaceTabs.length} terminals`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleWorkspaceClick(workspace.id)
                    }
                  }}
                >
                  <button
                    className="workspace-tree-expand"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleWorkspace(workspace.id)
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                      <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span
                    className="terminal-tree-icon"
                    style={{ backgroundColor: workspace.color }}
                  >
                    {workspace.icon}
                  </span>
                  {editingId === workspace.id ? (
                    <input
                      type="text"
                      className="workspace-edit-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleSaveRename(workspace.id)}
                      onKeyDown={(e) => handleKeyDown(e, workspace.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="terminal-tree-name">{workspace.name}</span>
                  )}
                  <span className="workspace-tree-count">{workspaceTabs.length}</span>
                  <div
                    className="workspace-tree-add-wrapper"
                    ref={profileDropdownId === workspace.id ? profileDropdownRef : undefined}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="workspace-tree-add"
                      onClick={(e) => {
                        e.stopPropagation()
                        setProfileDropdownId(profileDropdownId === workspace.id ? null : workspace.id)
                      }}
                      title="Add terminal to workspace"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                    {profileDropdownId === workspace.id && (
                      <div className="sidebar-profile-dropdown workspace-level">
                        <div className="sidebar-profile-dropdown-header">Select Terminal Type</div>
                        {profiles.map((profile) => (
                          <button
                            key={profile.id}
                            className="sidebar-profile-dropdown-item"
                            onClick={() => {
                              onCreateTerminal(profile.id, workspace.id)
                              setProfileDropdownId(null)
                            }}
                          >
                            <span className="sidebar-profile-dropdown-icon">
                              <TerminalIcon icon={profile.icon} size={18} />
                            </span>
                            <div className="sidebar-profile-dropdown-info">
                              <span className="sidebar-profile-dropdown-name">{profile.name}</span>
                              <span className="sidebar-profile-dropdown-path">{profile.shell}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="workspace-tree-children" role="group">
                    {workspaceTabs.map((tab) => {
                      const profile = getProfile(tab.profileId)
                      return (
                        <div
                          key={tab.id}
                          className={`terminal-tree-item ${tab.id === activeTabId ? 'active' : ''}`}
                          onClick={() => handleTerminalClick(tab.id, tab.workspaceId)}
                          onContextMenu={(e) => handleContextMenu(e, 'terminal', tab.id)}
                          role="treeitem"
                          tabIndex={0}
                          aria-selected={tab.id === activeTabId}
                          aria-label={`Terminal: ${tab.title}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleTerminalClick(tab.id, tab.workspaceId)
                            }
                          }}
                        >
                          <span className="terminal-tree-icon-wrapper">
                            <TerminalIcon icon={profile.icon} size={18} />
                          </span>
                          {editingId === tab.id && editingType === 'terminal' ? (
                            <input
                              type="text"
                              className="workspace-edit-input"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={() => handleSaveRename(tab.id)}
                              onKeyDown={(e) => handleKeyDown(e, tab.id)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          ) : (
                            <span className="terminal-tree-name">{tab.title}</span>
                          )}
                          <button
                            className="terminal-tree-close"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeTab(tab.id)
                            }}
                            title="Close"
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10">
                              <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                    {workspaceTabs.length === 0 && (
                      <div className="workspace-tree-empty">No terminals</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Unassigned Terminals */}
          {tabs.filter(t => !t.workspaceId).length > 0 && (
            <div className="workspace-tree-section">
              <div className="workspace-tree-section-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 17l6-6-6-6M12 19h8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Unassigned</span>
                <span className="workspace-tree-count">
                  {tabs.filter(t => !t.workspaceId).length}
                </span>
              </div>
              <div className="workspace-tree-children">
                {tabs.filter(t => !t.workspaceId).map((tab) => {
                  const profile = getProfile(tab.profileId)
                  return (
                    <div
                      key={tab.id}
                      className={`terminal-tree-item ${tab.id === activeTabId ? 'active' : ''}`}
                      onClick={() => handleTerminalClick(tab.id, undefined)}
                      onContextMenu={(e) => handleContextMenu(e, 'terminal', tab.id)}
                    >
                      <span className="terminal-tree-icon-wrapper">
                        <TerminalIcon icon={profile.icon} size={18} />
                      </span>
                      {editingId === tab.id && editingType === 'terminal' ? (
                        <input
                          type="text"
                          className="workspace-edit-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleSaveRename(tab.id)}
                          onKeyDown={(e) => handleKeyDown(e, tab.id)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <span className="terminal-tree-name">{tab.title}</span>
                      )}
                      <button
                        className="terminal-tree-close"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTab(tab.id)
                        }}
                        title="Close"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10">
                          <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Show message if no workspace selected */}
          {workspaces.length > 0 && !activeWorkspaceId && tabs.filter(t => !t.workspaceId).length === 0 && (
            <div className="workspace-tree-empty" style={{ padding: '12px' }}>
              No workspace selected
            </div>
          )}

          {/* Show message if no workspaces */}
          {workspaces.length === 0 && (
            <div className="workspace-tree-empty" style={{ padding: '12px' }}>
              Press Ctrl+T to create a workspace or terminal
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="workspace-sidebar-footer">
          <button className="workspace-settings-btn" onClick={onOpenSettings}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="8" cy="8" r="2" />
              <path d="M8 1v2M8 13v2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M1 8h2M13 8h2M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" />
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Context Menu */}
      {contextMenu && createPortal(
        <>
          <div
            className="context-menu-overlay"
            onClick={() => {
              setContextMenu(null)
              setColorPicker(null)
            }}
          />
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.type === 'workspace' && (
              <>
                <button className="context-menu-item" onClick={handleAddTerminalToWorkspace}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 3V13M3 8H13" strokeLinecap="round" />
                  </svg>
                  <span>Add Terminal</span>
                </button>
                <button className="context-menu-item" onClick={handleRename}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11.5 1.5l3 3L5 14H2v-3l9.5-9.5z" />
                  </svg>
                  <span>Rename</span>
                </button>
                <button
                  className="context-menu-item"
                  onClick={() => setColorPicker(colorPicker ? null : contextMenu.id)}
                >
                  <span
                    className="context-menu-color-preview"
                    style={{ backgroundColor: workspaces.find(w => w.id === contextMenu.id)?.color }}
                  />
                  <span>Change Color</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" style={{ marginLeft: 'auto' }}>
                    <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </button>
                {colorPicker && (
                  <div className="context-menu-colors">
                    {workspaceColors.map((color) => (
                      <button
                        key={color}
                        className="context-menu-color-btn"
                        style={{ backgroundColor: color }}
                        onClick={() => handleChangeColor(color)}
                      />
                    ))}
                  </div>
                )}
                <div className="context-menu-divider" />
              </>
            )}
            {contextMenu.type === 'terminal' && (
              <>
                <button className="context-menu-item" onClick={handleRename}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11.5 1.5l3 3L5 14H2v-3l9.5-9.5z" />
                  </svg>
                  <span>Rename</span>
                </button>
                <div className="context-menu-divider" />
                <div className="context-menu-header">Move to Workspace</div>
                <button
                  className="context-menu-item"
                  onClick={() => {
                    updateTab(contextMenu.id, { workspaceId: undefined })
                    setContextMenu(null)
                  }}
                >
                  <span className="context-menu-icon none">—</span>
                  <span>No Workspace</span>
                </button>
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    className="context-menu-item"
                    onClick={() => {
                      updateTab(contextMenu.id, { workspaceId: workspace.id })
                      setContextMenu(null)
                    }}
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
                <div className="context-menu-divider" />
              </>
            )}
            <button
              className="context-menu-item delete"
              onClick={handleDelete}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 2V1h5v1h4v1h-1v11H2.5V3h-1V2h4zm1 2v9h1V4h-1zm3 0v9h1V4h-1z" />
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
