import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight, Plus, ChevronDown as DropdownArrow } from 'lucide-react'
import type { LayoutType } from '../../hooks/usePaneOperations'
import { useTerminalTabs, useTerminalActions } from '../../store/terminalStore'
import { useProfiles } from '../../store/settingsStore'
import { useWorkspaces, useActiveWorkspaceId, useWorkspaceActions } from '../../store/workspaceStore'
import { TerminalIcon } from '../Icons/TerminalIcons'
import { TabItem } from './TabItem'
import { TabContextMenu } from './TabContextMenu'
import { WindowControls } from './WindowControls'
import type { Profile } from '../../types'

interface TabBarProps {
  onNewTab: (profileId?: string) => void
  onCreateTab: (profileId?: string) => void
  onCloseTab: (tabId: string) => void
  onToggleSidebar: () => void
  sidebarExpanded: boolean
  onApplyLayout: (layout: LayoutType, profileId?: string) => void
}

const TabBarComponent: React.FC<TabBarProps> = ({
  onNewTab,
  onCreateTab,
  onCloseTab,
  onToggleSidebar,
  sidebarExpanded,
  onApplyLayout
}) => {
  // Stores - using selectors for optimized re-renders
  const tabs = useTerminalTabs()
  const { setActiveTab, updateTab, reorderTabs } = useTerminalActions()
  const profiles = useProfiles()
  const workspaces = useWorkspaces()
  const activeWorkspaceId = useActiveWorkspaceId()
  const { setActiveWorkspace, addWorkspace } = useWorkspaceActions()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false)
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false)
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null)
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const layoutDropdownRef = useRef<HTMLDivElement>(null)
  const workspaceDropdownRef = useRef<HTMLDivElement>(null)
  const tabsContainerRef = useRef<HTMLDivElement>(null)

  const filteredTabs = useMemo(
    () => tabs.filter((tab) => (activeWorkspaceId ? tab.workspaceId === activeWorkspaceId : !tab.workspaceId)),
    [tabs, activeWorkspaceId]
  )

  const getProfile = useCallback(
    (profileId: string): Profile => {
      return profiles.find((p) => p.id === profileId) || profiles[0]
    },
    [profiles]
  )

  const checkOverflow = useCallback(() => {
    const el = tabsContainerRef.current
    if (!el) return
    setShowLeftArrow(el.scrollLeft > 0)
    setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    checkOverflow()
    const el = tabsContainerRef.current
    if (!el) return
    el.addEventListener('scroll', checkOverflow)
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', checkOverflow)
      observer.disconnect()
    }
  }, [checkOverflow, filteredTabs.length])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollLeft += e.deltaY
    }
  }, [])

  const activeTabId = useMemo(() => filteredTabs.find((t) => t.isActive)?.id, [filteredTabs])

  useEffect(() => {
    if (!tabsContainerRef.current || !activeTabId) return
    const activeEl = tabsContainerRef.current.querySelector(`[data-tab-id="${activeTabId}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  }, [activeTabId])

  const scrollLeft = useCallback(() => {
    tabsContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }, [])
  const scrollRight = useCallback(() => {
    tabsContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }, [])

  // Close dropdowns and context menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(e.target as Node)) {
        setLayoutDropdownOpen(false)
      }
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false)
      }
      setTabContextMenu(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNewTabWithProfile = useCallback(
    (profile: Profile) => {
      onCreateTab(profile.id)
      setDropdownOpen(false)
    },
    [onCreateTab]
  )

  const handleTabContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setTabContextMenu({ x: e.clientX, y: e.clientY, tabId })
  }, [])

  const handleMoveToWorkspace = useCallback(
    (workspaceId: string | undefined) => {
      if (tabContextMenu) {
        updateTab(tabContextMenu.tabId, { workspaceId })
        setTabContextMenu(null)
      }
    },
    [tabContextMenu, updateTab]
  )

  const handleSetTabColor = useCallback(
    (color: string | undefined) => {
      if (tabContextMenu) {
        updateTab(tabContextMenu.tabId, { color })
      }
    },
    [tabContextMenu, updateTab]
  )

  const handleTogglePin = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId)
      if (tab) {
        updateTab(tabId, { pinned: !tab.pinned })
      }
    },
    [tabs, updateTab]
  )

  // Sort tabs: pinned first, then unpinned in original order
  const sortedFilteredTabs = useMemo(() => {
    const pinned = filteredTabs.filter((t) => t.pinned)
    const unpinned = filteredTabs.filter((t) => !t.pinned)
    return [...pinned, ...unpinned]
  }, [filteredTabs])

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)

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
          <PanelLeftClose size={16} strokeWidth={1.5} />
        ) : (
          <PanelLeftOpen size={16} strokeWidth={1.5} />
        )}
      </button>

      {/* Layout Picker */}
      <div className="layout-picker" ref={layoutDropdownRef}>
        <button
          className="split-btn"
          onClick={() => setLayoutDropdownOpen(!layoutDropdownOpen)}
          title="Split layout"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="6" height="14" rx="1" />
            <rect x="9" y="1" width="6" height="14" rx="1" />
          </svg>
        </button>
        {layoutDropdownOpen && (
          <div className="layout-dropdown">
            <div className="layout-dropdown-header">Layout</div>
            {([
              { layout: '1x1' as LayoutType, label: 'Reset', svg: <svg width="24" height="18" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="1" width="22" height="16" rx="1.5" /></svg> },
              { layout: '1x2' as LayoutType, label: '1 x 2', svg: <svg width="24" height="18" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="1" width="10" height="16" rx="1.5" /><rect x="13" y="1" width="10" height="16" rx="1.5" /></svg> },
              { layout: '2x1' as LayoutType, label: '2 x 1', svg: <svg width="24" height="18" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="1" width="22" height="7" rx="1.5" /><rect x="1" y="10" width="22" height="7" rx="1.5" /></svg> },
              { layout: '2x2' as LayoutType, label: '2 x 2', svg: <svg width="24" height="18" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="1" width="10" height="7" rx="1.5" /><rect x="13" y="1" width="10" height="7" rx="1.5" /><rect x="1" y="10" width="10" height="7" rx="1.5" /><rect x="13" y="10" width="10" height="7" rx="1.5" /></svg> },
              { layout: '1x3' as LayoutType, label: '1 x 3', svg: <svg width="24" height="18" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="1" width="6.5" height="16" rx="1.5" /><rect x="9" y="1" width="6" height="16" rx="1.5" /><rect x="16.5" y="1" width="6.5" height="16" rx="1.5" /></svg> },
              { layout: '3x1' as LayoutType, label: '3 x 1', svg: <svg width="24" height="18" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="1" width="22" height="4.2" rx="1.5" /><rect x="1" y="6.9" width="22" height="4.2" rx="1.5" /><rect x="1" y="12.8" width="22" height="4.2" rx="1.5" /></svg> }
            ]).map(({ layout, label, svg }) => (
              <button
                key={layout}
                className="layout-dropdown-item"
                onClick={() => {
                  onApplyLayout(layout)
                  setLayoutDropdownOpen(false)
                }}
              >
                {svg}
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Workspace Selector */}
      {activeWorkspaceId && (
        <div className="workspace-selector" ref={workspaceDropdownRef}>
          <button
            className="workspace-selector-btn"
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            title="Switch workspace"
          >
            <span className="workspace-selector-label">{activeWorkspace?.name || 'Workspace'}</span>
            <DropdownArrow size={8} strokeWidth={1.5} />
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
                  <Plus size={12} strokeWidth={1.5} />
                </span>
                <span className="workspace-dropdown-name">New Workspace</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="tabbar-divider" />

      {showLeftArrow && (
        <button className="tab-scroll-indicator tab-scroll-left" onClick={scrollLeft}>
          <ChevronLeft size={14} />
        </button>
      )}

      <div
        className="tabbar-tabs"
        ref={tabsContainerRef}
        onWheel={handleWheel}
        role="tablist"
        aria-label="Terminal tabs"
      >
        {sortedFilteredTabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            profile={getProfile(tab.profileId)}
            isActive={tab.isActive}
            isDragging={draggedTabId === tab.id}
            isDragOver={dragOverTabId === tab.id}
            dataTabId={tab.id}
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
                const fromIndex = tabs.findIndex((t) => t.id === draggedTabId)
                const toIndex = tabs.findIndex((t) => t.id === tab.id)
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

      {showRightArrow && (
        <button className="tab-scroll-indicator tab-scroll-right" onClick={scrollRight}>
          <ChevronRight size={14} />
        </button>
      )}

      {/* New Tab Button with Dropdown */}
      <div className="tab-new-wrapper" ref={dropdownRef}>
        <button className="tab-new" onClick={() => onNewTab()} title="New tab (Ctrl+T)">
          <Plus size={14} strokeWidth={1.5} />
        </button>
        <button className="tab-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)} title="Select terminal type">
          <DropdownArrow size={8} strokeWidth={1.5} />
        </button>

        {dropdownOpen && (
          <div className="profile-dropdown">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className="profile-dropdown-item"
                onClick={() => handleNewTabWithProfile(profile)}
              >
                <TerminalIcon icon={profile.icon} size={16} className="profile-dropdown-icon" />
                <span className="profile-dropdown-name">{profile.name}</span>
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
          currentColor={tabs.find((t) => t.id === tabContextMenu.tabId)?.color}
          isPinned={tabs.find((t) => t.id === tabContextMenu.tabId)?.pinned}
          workspaces={workspaces}
          onClose={() => setTabContextMenu(null)}
          onTogglePin={handleTogglePin}
          onMoveToWorkspace={handleMoveToWorkspace}
          onSetColor={handleSetTabColor}
        />
      )}
    </div>
  )
}

export const TabBar = React.memo(TabBarComponent)
