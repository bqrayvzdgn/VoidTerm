import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useTerminalTabs, useTabGroups, useTerminalActions } from '../../store/terminalStore'
import { useProfiles } from '../../store/settingsStore'
import { useWorkspaces, useActiveWorkspaceId, useWorkspaceActions } from '../../store/workspaceStore'
import { TerminalIcon } from '../Icons/TerminalIcons'
import { TabItem } from './TabItem'
import { TabContextMenu } from './TabContextMenu'
import { GroupContextMenu } from './GroupContextMenu'
import { WindowControls } from './WindowControls'
import type { Profile, Tab, TabGroup } from '../../types'

interface TabBarProps {
  onNewTab: (profileId?: string) => void
  onCreateTab: (profileId?: string) => void
  onCloseTab: (tabId: string) => void
  onToggleSidebar: () => void
  sidebarExpanded: boolean
}

const TabBarComponent: React.FC<TabBarProps> = ({ onNewTab, onCreateTab, onCloseTab, onToggleSidebar, sidebarExpanded }) => {
  // Stores - using selectors for optimized re-renders
  const tabs = useTerminalTabs()
  const tabGroups = useTabGroups()
  const {
    setActiveTab,
    updateTab,
    reorderTabs,
    createTabGroup,
    removeTabGroup,
    updateTabGroup,
    addTabToGroup,
    removeTabFromGroup,
    toggleGroupCollapse
  } = useTerminalActions()
  const profiles = useProfiles()
  const workspaces = useWorkspaces()
  const activeWorkspaceId = useActiveWorkspaceId()
  const { setActiveWorkspace, addWorkspace } = useWorkspaceActions()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false)
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null)
  const [groupContextMenu, setGroupContextMenu] = useState<{ x: number; y: number; groupId: string } | null>(null)
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const workspaceDropdownRef = useRef<HTMLDivElement>(null)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const groupNameInputRef = useRef<HTMLInputElement>(null)

  const filteredTabs = useMemo(() =>
    tabs.filter(tab => activeWorkspaceId ? tab.workspaceId === activeWorkspaceId : !tab.workspaceId),
    [tabs, activeWorkspaceId]
  )

  const organizedTabs = useMemo(() => {
    const ungrouped: Tab[] = []
    const grouped: Map<string, Tab[]> = new Map()

    filteredTabs.forEach(tab => {
      if (tab.groupId) {
        const groupTabs = grouped.get(tab.groupId) || []
        groupTabs.push(tab)
        grouped.set(tab.groupId, groupTabs)
      } else {
        ungrouped.push(tab)
      }
    })

    return { ungrouped, grouped }
  }, [filteredTabs])

  const getProfile = useCallback((profileId: string): Profile => {
    return profiles.find(p => p.id === profileId) || profiles[0]
  }, [profiles])

  // Handle horizontal scroll with mouse wheel
  useEffect(() => {
    const container = tabsContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      container.scrollLeft += e.deltaY * 0.3
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  // Focus input when editing group name
  useEffect(() => {
    if (editingGroupId && groupNameInputRef.current) {
      groupNameInputRef.current.focus()
      groupNameInputRef.current.select()
    }
  }, [editingGroupId])

  // Close dropdowns and context menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false)
      }
      setTabContextMenu(null)
      setGroupContextMenu(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNewTabWithProfile = useCallback((profile: Profile) => {
    onCreateTab(profile.id)
    setDropdownOpen(false)
  }, [onCreateTab])

  const handleTabContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setGroupContextMenu(null)
    setTabContextMenu({ x: e.clientX, y: e.clientY, tabId })
  }, [])

  const handleGroupContextMenu = useCallback((e: React.MouseEvent, groupId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setTabContextMenu(null)
    setGroupContextMenu({ x: e.clientX, y: e.clientY, groupId })
  }, [])

  const handleMoveToWorkspace = useCallback((workspaceId: string | undefined) => {
    if (tabContextMenu) {
      updateTab(tabContextMenu.tabId, { workspaceId })
      setTabContextMenu(null)
    }
  }, [tabContextMenu, updateTab])

  const handleCreateGroup = useCallback(() => {
    if (tabContextMenu) {
      createTabGroup(undefined, [tabContextMenu.tabId])
      setTabContextMenu(null)
    }
  }, [tabContextMenu, createTabGroup])

  const handleAddToGroup = useCallback((groupId: string) => {
    if (tabContextMenu) {
      addTabToGroup(tabContextMenu.tabId, groupId)
      setTabContextMenu(null)
    }
  }, [tabContextMenu, addTabToGroup])

  const handleRemoveFromGroup = useCallback(() => {
    if (tabContextMenu) {
      removeTabFromGroup(tabContextMenu.tabId)
      setTabContextMenu(null)
    }
  }, [tabContextMenu, removeTabFromGroup])

  const handleDeleteGroup = useCallback(() => {
    if (groupContextMenu) {
      removeTabGroup(groupContextMenu.groupId)
      setGroupContextMenu(null)
    }
  }, [groupContextMenu, removeTabGroup])

  const handleStartRenameGroup = useCallback(() => {
    if (groupContextMenu) {
      const group = tabGroups.find(g => g.id === groupContextMenu.groupId)
      if (group) {
        setEditingGroupId(groupContextMenu.groupId)
        setEditingGroupName(group.name)
        setGroupContextMenu(null)
      }
    }
  }, [groupContextMenu, tabGroups])

  const handleFinishRenameGroup = useCallback(() => {
    if (editingGroupId && editingGroupName.trim()) {
      updateTabGroup(editingGroupId, { name: editingGroupName.trim() })
    }
    setEditingGroupId(null)
    setEditingGroupName('')
  }, [editingGroupId, editingGroupName, updateTabGroup])

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
  const contextMenuTab = tabContextMenu ? tabs.find(t => t.id === tabContextMenu.tabId) : null

  const renderTabGroup = (group: TabGroup, groupTabs: Tab[]) => {
    const isCollapsed = group.isCollapsed
    const activeTabInGroup = groupTabs.some(t => t.isActive)

    return (
      <div key={group.id} className={`tab-group ${isCollapsed ? 'collapsed' : ''}`}>
        <div
          className={`tab-group-header ${activeTabInGroup ? 'has-active' : ''}`}
          style={{ backgroundColor: group.color + '30', borderColor: group.color }}
          onClick={() => toggleGroupCollapse(group.id)}
          onContextMenu={(e) => handleGroupContextMenu(e, group.id)}
        >
          <span className="tab-group-collapse-icon">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              {isCollapsed ? (
                <path d="M3 1L7 5L3 9" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M1 3L5 7L9 3" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </span>
          {editingGroupId === group.id ? (
            <input
              ref={groupNameInputRef}
              type="text"
              className="tab-group-name-input"
              value={editingGroupName}
              onChange={(e) => setEditingGroupName(e.target.value)}
              onBlur={handleFinishRenameGroup}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishRenameGroup()
                if (e.key === 'Escape') {
                  setEditingGroupId(null)
                  setEditingGroupName('')
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="tab-group-name">{group.name}</span>
          )}
          <span className="tab-group-count">{groupTabs.length}</span>
        </div>
        {!isCollapsed && (
          <div className="tab-group-tabs">
            {groupTabs.map(tab => (
              <TabItem
                key={tab.id}
                tab={tab}
                profile={getProfile(tab.profileId)}
                isActive={tab.isActive}
                isDragging={draggedTabId === tab.id}
                isDragOver={dragOverTabId === tab.id}
                inGroup
                onSelect={() => setActiveTab(tab.id)}
                onClose={() => onCloseTab(tab.id)}
                onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
                onDragStart={(e) => {
                  setDraggedTabId(tab.id)
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', tab.id)
                }}
                onDragEnd={() => {
                  setDraggedTabId(null)
                  setDragOverTabId(null)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (draggedTabId && draggedTabId !== tab.id) {
                    setDragOverTabId(tab.id)
                  }
                }}
                onDragLeave={() => setDragOverTabId(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggedTabId && draggedTabId !== tab.id) {
                    const fromIndex = tabs.findIndex(t => t.id === draggedTabId)
                    const toIndex = tabs.findIndex(t => t.id === tab.id)
                    if (fromIndex !== -1 && toIndex !== -1) {
                      reorderTabs(fromIndex, toIndex)
                    }
                  }
                  setDraggedTabId(null)
                  setDragOverTabId(null)
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="tabbar" role="toolbar" aria-label="Tab bar">
      {/* Sidebar Toggle */}
      <button
        className="sidebar-toggle-btn"
        onClick={onToggleSidebar}
        title={sidebarExpanded ? 'Hide sidebar' : 'Show sidebar'}
        aria-label={sidebarExpanded ? 'Hide sidebar' : 'Show sidebar'}
        aria-expanded={sidebarExpanded}
      >
        {sidebarExpanded ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="1" y="2" width="14" height="12" rx="1" />
            <line x1="5" y1="2" x2="5" y2="14" />
            <path d="M8 8L11 6V10L8 8Z" fill="currentColor" stroke="none" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="1" y="2" width="14" height="12" rx="1" />
            <line x1="5" y1="2" x2="5" y2="14" />
            <path d="M11 8L8 6V10L11 8Z" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>

      {/* Workspace Selector */}
      {activeWorkspaceId && (
        <div className="workspace-selector" ref={workspaceDropdownRef}>
          <button
            className="workspace-selector-btn"
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            title="Switch workspace"
          >
            <span
              className="workspace-selector-icon"
              style={{ backgroundColor: activeWorkspace?.color || '#666' }}
            >
              {activeWorkspace?.icon || 'W'}
            </span>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {workspaceDropdownOpen && (
            <div className="workspace-dropdown">
              <div className="workspace-dropdown-header">Workspaces</div>
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  className={`workspace-dropdown-item ${workspace.id === activeWorkspaceId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveWorkspace(workspace.id === activeWorkspaceId ? null : workspace.id)
                    setWorkspaceDropdownOpen(false)
                  }}
                >
                  <span
                    className="workspace-dropdown-icon"
                    style={{ backgroundColor: workspace.color }}
                  >
                    {workspace.icon}
                  </span>
                  <span className="workspace-dropdown-name">{workspace.name}</span>
                </button>
              ))}
              <div className="workspace-dropdown-divider" />
              <button
                className="workspace-dropdown-item"
                onClick={() => {
                  addWorkspace()
                  setWorkspaceDropdownOpen(false)
                }}
              >
                <span className="workspace-dropdown-add">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="workspace-dropdown-name">New Workspace</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="tabbar-divider" />

      <div className="tabbar-tabs" ref={tabsContainerRef} role="tablist" aria-label="Terminal tabs">
        {tabGroups.map(group => {
          const groupTabs = organizedTabs.grouped.get(group.id)
          if (!groupTabs || groupTabs.length === 0) return null
          return renderTabGroup(group, groupTabs)
        })}

        {organizedTabs.ungrouped.map(tab => (
          <TabItem
            key={tab.id}
            tab={tab}
            profile={getProfile(tab.profileId)}
            isActive={tab.isActive}
            isDragging={draggedTabId === tab.id}
            isDragOver={dragOverTabId === tab.id}
            onSelect={() => setActiveTab(tab.id)}
            onClose={() => onCloseTab(tab.id)}
            onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
            onDragStart={(e) => {
              setDraggedTabId(tab.id)
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/plain', tab.id)
            }}
            onDragEnd={() => {
              setDraggedTabId(null)
              setDragOverTabId(null)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              if (draggedTabId && draggedTabId !== tab.id) {
                setDragOverTabId(tab.id)
              }
            }}
            onDragLeave={() => setDragOverTabId(null)}
            onDrop={(e) => {
              e.preventDefault()
              if (draggedTabId && draggedTabId !== tab.id) {
                const fromIndex = tabs.findIndex(t => t.id === draggedTabId)
                const toIndex = tabs.findIndex(t => t.id === tab.id)
                if (fromIndex !== -1 && toIndex !== -1) {
                  reorderTabs(fromIndex, toIndex)
                }
              }
              setDraggedTabId(null)
              setDragOverTabId(null)
            }}
          />
        ))}
      </div>

      {/* New Tab Button with Dropdown */}
      <div className="tab-new-wrapper" ref={dropdownRef}>
        <button
          className="tab-new"
          onClick={() => onNewTab()}
          title="New tab (Ctrl+T)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className="tab-dropdown"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title="Select terminal type"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="profile-dropdown">
            <div className="profile-dropdown-header">Select Terminal Type</div>
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className="profile-dropdown-item"
                onClick={() => handleNewTabWithProfile(profile)}
              >
                <span className="profile-dropdown-icon-wrapper">
                  <TerminalIcon icon={profile.icon} size={20} />
                </span>
                <div className="profile-dropdown-info">
                  <span className="profile-dropdown-name">{profile.name}</span>
                  <span className="profile-dropdown-path">{profile.shell}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tabbar-drag-region"></div>

      <WindowControls />

      {tabContextMenu && (
        <TabContextMenu
          x={tabContextMenu.x}
          y={tabContextMenu.y}
          tabId={tabContextMenu.tabId}
          tabGroupId={contextMenuTab?.groupId}
          tabGroups={tabGroups}
          workspaces={workspaces}
          onClose={() => setTabContextMenu(null)}
          onCreateGroup={handleCreateGroup}
          onAddToGroup={handleAddToGroup}
          onRemoveFromGroup={handleRemoveFromGroup}
          onMoveToWorkspace={handleMoveToWorkspace}
        />
      )}

      {groupContextMenu && (
        <GroupContextMenu
          x={groupContextMenu.x}
          y={groupContextMenu.y}
          onClose={() => setGroupContextMenu(null)}
          onRename={handleStartRenameGroup}
          onDelete={handleDeleteGroup}
        />
      )}
    </div>
  )
}

export const TabBar = React.memo(TabBarComponent)
