import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTerminalStore } from '../../store/terminalStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useTranslation } from '../../i18n'
import { TerminalIcon } from '../Icons/TerminalIcons'
import type { Profile, Tab, TabGroup } from '../../types'

interface TabBarProps {
  onNewTab: (profileId?: string) => void
  onCreateTab: (profileId?: string) => void
  onCloseTab: (tabId: string) => void
  onToggleSidebar: () => void
  sidebarExpanded: boolean
}

const TabBarComponent: React.FC<TabBarProps> = ({ onNewTab, onCreateTab, onCloseTab, onToggleSidebar, sidebarExpanded }) => {
  const { t } = useTranslation()
  const { 
    tabs, 
    tabGroups,
    setActiveTab, 
    updateTab, 
    reorderTabs,
    createTabGroup,
    removeTabGroup,
    updateTabGroup,
    addTabToGroup,
    removeTabFromGroup,
    toggleGroupCollapse
  } = useTerminalStore()
  const { profiles } = useSettingsStore()
  const { workspaces, activeWorkspaceId, setActiveWorkspace, addWorkspace } = useWorkspaceStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
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

  // Filtrelenmiş tablar (aktif workspace'e göre)
  const filteredTabs = useMemo(() => 
    tabs.filter(tab => activeWorkspaceId ? tab.workspaceId === activeWorkspaceId : !tab.workspaceId),
    [tabs, activeWorkspaceId]
  )

  // Tabları gruplara göre organize et
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

  // Handle horizontal scroll with mouse wheel
  const handleTabsWheel = (e: React.WheelEvent) => {
    if (tabsContainerRef.current) {
      e.preventDefault()
      tabsContainerRef.current.scrollLeft += e.deltaY * 0.3
    }
  }

  const getProfile = (profileId: string) => {
    return profiles.find(p => p.id === profileId) || profiles[0]
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    onCloseTab(tabId)
  }

  const handleNewTabWithProfile = (profile: Profile) => {
    onCreateTab(profile.id)
    setDropdownOpen(false)
  }

  // Tab context menu
  const handleTabContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setGroupContextMenu(null)
    setTabContextMenu({ x: e.clientX, y: e.clientY, tabId })
  }

  // Group context menu
  const handleGroupContextMenu = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setTabContextMenu(null)
    setGroupContextMenu({ x: e.clientX, y: e.clientY, groupId })
  }

  const handleMoveToWorkspace = (workspaceId: string | undefined) => {
    if (tabContextMenu) {
      updateTab(tabContextMenu.tabId, { workspaceId })
      setTabContextMenu(null)
    }
  }

  const handleCreateGroup = () => {
    if (tabContextMenu) {
      createTabGroup(undefined, [tabContextMenu.tabId])
      setTabContextMenu(null)
    }
  }

  const handleAddToGroup = (groupId: string) => {
    if (tabContextMenu) {
      addTabToGroup(tabContextMenu.tabId, groupId)
      setTabContextMenu(null)
    }
  }

  const handleRemoveFromGroup = () => {
    if (tabContextMenu) {
      removeTabFromGroup(tabContextMenu.tabId)
      setTabContextMenu(null)
    }
  }

  const handleDeleteGroup = () => {
    if (groupContextMenu) {
      removeTabGroup(groupContextMenu.groupId)
      setGroupContextMenu(null)
    }
  }

  const handleStartRenameGroup = () => {
    if (groupContextMenu) {
      const group = tabGroups.find(g => g.id === groupContextMenu.groupId)
      if (group) {
        setEditingGroupId(groupContextMenu.groupId)
        setEditingGroupName(group.name)
        setGroupContextMenu(null)
      }
    }
  }

  const handleFinishRenameGroup = () => {
    if (editingGroupId && editingGroupName.trim()) {
      updateTabGroup(editingGroupId, { name: editingGroupName.trim() })
    }
    setEditingGroupId(null)
    setEditingGroupName('')
  }

  // Window controls
  const handleMinimize = () => window.electronAPI.windowMinimize()
  const handleMaximize = () => window.electronAPI.windowMaximize()
  const handleClose = () => window.electronAPI.windowClose()

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)

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

  // Listen for window maximize state changes
  useEffect(() => {
    const removeListener = window.electronAPI.onWindowMaximized((maximized) => {
      setIsMaximized(maximized)
    })
    return () => removeListener()
  }, [])

  // Tab render fonksiyonu
  const renderTab = (tab: Tab, inGroup?: boolean) => {
    const profile = getProfile(tab.profileId)
    
    return (
      <div
        key={tab.id}
        role="tab"
        tabIndex={tab.isActive ? 0 : -1}
        aria-selected={tab.isActive}
        aria-label={`${tab.title} terminal tab`}
        className={`tab ${tab.isActive ? 'active' : ''} ${draggedTabId === tab.id ? 'dragging' : ''} ${dragOverTabId === tab.id ? 'drag-over' : ''} ${inGroup ? 'in-group' : ''}`}
        style={{
          borderBottom: profile.color ? `2px solid ${profile.color}` : undefined
        }}
        onClick={() => setActiveTab(tab.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setActiveTab(tab.id)
          }
        }}
        onMouseDown={(e) => {
          if (e.button === 1) {
            e.preventDefault()
            onCloseTab(tab.id)
          }
        }}
        onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
        draggable
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
        onDragLeave={() => {
          setDragOverTabId(null)
        }}
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
      >
        <span className="tab-icon-wrapper">
          <TerminalIcon icon={profile.icon || 'PS'} size={16} />
        </span>
        <span className="tab-title">
          {tab.title}
        </span>
        <span
          role="button"
          tabIndex={0}
          className="tab-close"
          onClick={(e) => handleCloseTab(e, tab.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              onCloseTab(tab.id)
            }
          }}
          title="Close tab"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M9.5 3.5L8.5 2.5L6 5L3.5 2.5L2.5 3.5L5 6L2.5 8.5L3.5 9.5L6 7L8.5 9.5L9.5 8.5L7 6L9.5 3.5Z" />
          </svg>
        </span>
      </div>
    )
  }

  // Tab grubu render fonksiyonu
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
            {groupTabs.map(tab => renderTab(tab, true))}
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

      <div className="tabbar-tabs" ref={tabsContainerRef} onWheel={handleTabsWheel} role="tablist" aria-label="Terminal tabs">
        {/* Gruplu tablar */}
        {tabGroups.map(group => {
          const groupTabs = organizedTabs.grouped.get(group.id)
          if (!groupTabs || groupTabs.length === 0) return null
          return renderTabGroup(group, groupTabs)
        })}
        
        {/* Grupsuz tablar */}
        {organizedTabs.ungrouped.map(tab => renderTab(tab))}
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

      {/* Drag region */}
      <div className="tabbar-drag-region"></div>

      {/* Window Controls */}
      <div className="tabbar-controls">
        <button className="window-btn" onClick={handleMinimize} title="Minimize">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <rect x="0" y="4.5" width="10" height="1" />
          </svg>
        </button>
        <button className="window-btn" onClick={handleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="2.5" width="7" height="7" />
              <path d="M2.5 2.5V0.5H9.5V7.5H7.5" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </button>
        <button className="window-btn close" onClick={handleClose} title="Close">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Tab Context Menu */}
      {tabContextMenu && createPortal(
        <>
          <div className="context-menu-overlay" onClick={() => setTabContextMenu(null)} />
          <div
            className="context-menu"
            style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
          >
            {/* Grup işlemleri */}
            <div className="context-menu-header">{t.tabbar.addToGroup}</div>
            
            {/* Yeni grup oluştur */}
            <button className="context-menu-item" onClick={handleCreateGroup}>
              <span className="context-menu-icon add">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span>{t.tabbar.createGroup}</span>
            </button>

            {/* Mevcut gruplar */}
            {tabGroups.map(group => (
              <button
                key={group.id}
                className="context-menu-item"
                onClick={() => handleAddToGroup(group.id)}
              >
                <span className="context-menu-icon" style={{ backgroundColor: group.color }}>
                  G
                </span>
                <span>{group.name}</span>
              </button>
            ))}

            {/* Tab gruptan çıkar */}
            {tabs.find(t => t.id === tabContextMenu.tabId)?.groupId && (
              <>
                <div className="context-menu-divider" />
                <button className="context-menu-item" onClick={handleRemoveFromGroup}>
                  <span className="context-menu-icon none">—</span>
                  <span>{t.tabbar.removeFromGroup}</span>
                </button>
              </>
            )}

            <div className="context-menu-divider" />
            <div className="context-menu-header">Move to Workspace</div>
            <button
              className="context-menu-item"
              onClick={() => handleMoveToWorkspace(undefined)}
            >
              <span className="context-menu-icon none">—</span>
              <span>No Workspace</span>
            </button>
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                className="context-menu-item"
                onClick={() => handleMoveToWorkspace(workspace.id)}
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
      )}

      {/* Group Context Menu */}
      {groupContextMenu && createPortal(
        <>
          <div className="context-menu-overlay" onClick={() => setGroupContextMenu(null)} />
          <div
            className="context-menu"
            style={{ left: groupContextMenu.x, top: groupContextMenu.y }}
          >
            <button className="context-menu-item" onClick={handleStartRenameGroup}>
              <span className="context-menu-icon edit">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>{t.tabbar.renameGroup}</span>
            </button>
            <button className="context-menu-item danger" onClick={handleDeleteGroup}>
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
      )}
    </div>
  )
}

export const TabBar = React.memo(TabBarComponent)
