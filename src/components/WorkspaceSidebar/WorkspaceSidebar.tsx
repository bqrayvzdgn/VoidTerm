import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Plus, Settings, Terminal, X, Pencil, Trash2 } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useTerminalStore, useTerminalTabs, useActiveTabId } from '../../store/terminalStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useShallow } from 'zustand/react/shallow'
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
  const { workspaces, activeWorkspaceId, setActiveWorkspace, removeWorkspace, updateWorkspace } = useWorkspaceStore(
    useShallow((s) => ({
      workspaces: s.workspaces,
      activeWorkspaceId: s.activeWorkspaceId,
      setActiveWorkspace: s.setActiveWorkspace,
      removeWorkspace: s.removeWorkspace,
      updateWorkspace: s.updateWorkspace
    }))
  )
  const tabs = useTerminalTabs()
  const activeTabId = useActiveTabId()
  const { setActiveTab, removeTab, updateTab } = useTerminalStore(
    useShallow((s) => ({
      setActiveTab: s.setActiveTab,
      removeTab: s.removeTab,
      updateTab: s.updateTab
    }))
  )
  const profiles = useSettingsStore(useShallow((s) => s.profiles))

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

  const handleAddTerminalToWorkspace = () => {
    if (contextMenu && contextMenu.type === 'workspace') {
      onCreateTerminal(undefined, contextMenu.id)
    }
    setContextMenu(null)
  }

  const getProfile = (profileId: string) => {
    return profiles.find((p) => p.id === profileId) || profiles[0]
  }

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
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
          <span className="workspace-sidebar-title" id="sidebar-title">
            Explorer
          </span>
          <button
            className="workspace-sidebar-add"
            onClick={() => onNewTab()}
            title="New"
            aria-label="Create new workspace or terminal"
          >
            <Plus size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Tree View */}
        <nav className="workspace-tree" role="tree" aria-labelledby="sidebar-title">
          {/* Workspaces with their terminals */}
          {workspaces.map((workspace) => {
            const isActive = workspace.id === activeWorkspaceId
            const isExpanded = expandedWorkspaces.has(workspace.id)
            const workspaceTabs = tabs.filter((t) => t.workspaceId === workspace.id)

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
                    <ChevronRight
                      size={10}
                      strokeWidth={1.5}
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    />
                  </button>
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
                      <Plus size={12} strokeWidth={1.5} />
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
                            <X size={10} strokeWidth={1.5} />
                          </button>
                        </div>
                      )
                    })}
                    {workspaceTabs.length === 0 && <div className="workspace-tree-empty">No terminals</div>}
                  </div>
                )}
              </div>
            )
          })}

          {/* Unassigned Terminals */}
          {tabs.filter((t) => !t.workspaceId).length > 0 && (
            <div className="workspace-tree-section">
              <div className="workspace-tree-section-header">
                <Terminal size={14} strokeWidth={1.5} />
                <span>Unassigned</span>
                <span className="workspace-tree-count">{tabs.filter((t) => !t.workspaceId).length}</span>
              </div>
              <div className="workspace-tree-children">
                {tabs
                  .filter((t) => !t.workspaceId)
                  .map((tab) => {
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
                          <X size={10} strokeWidth={1.5} />
                        </button>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Show message if no workspace selected */}
          {workspaces.length > 0 && !activeWorkspaceId && tabs.filter((t) => !t.workspaceId).length === 0 && (
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
            <Settings size={16} strokeWidth={1.5} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Context Menu */}
      {contextMenu &&
        createPortal(
          <>
            <div
              className="context-menu-overlay"
              onClick={() => {
                setContextMenu(null)
              }}
            />
            <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
              {contextMenu.type === 'workspace' && (
                <>
                  <button className="context-menu-item" onClick={handleAddTerminalToWorkspace}>
                    <Plus size={14} strokeWidth={1.5} />
                    <span>Add Terminal</span>
                  </button>
                  <button className="context-menu-item" onClick={handleRename}>
                    <Pencil size={14} strokeWidth={1.5} />
                    <span>Rename</span>
                  </button>
                  <div className="context-menu-divider" />
                </>
              )}
              {contextMenu.type === 'terminal' && (
                <>
                  <button className="context-menu-item" onClick={handleRename}>
                    <Pencil size={14} strokeWidth={1.5} />
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
                      <span>{workspace.name}</span>
                    </button>
                  ))}
                  <div className="context-menu-divider" />
                </>
              )}
              <button className="context-menu-item delete" onClick={handleDelete}>
                <Trash2 size={14} strokeWidth={1.5} />
                <span>Delete</span>
              </button>
            </div>
          </>,
          document.body
        )}
    </>
  )
}
