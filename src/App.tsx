import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { TabBar } from './components/TabBar/TabBar'
import { WorkspaceSidebar } from './components/WorkspaceSidebar/WorkspaceSidebar'
import { SplitPane } from './components/SplitPane/SplitPane'
import { Settings } from './components/Settings/Settings'
import { CreateDialog } from './components/CreateDialog/CreateDialog'
import { useTerminalStore } from './store/terminalStore'
import { useSettingsStore, useIsConfigLoaded, useSettingsActions } from './store/settingsStore'
import { useWorkspaceStore, useIsWorkspacesLoaded, useWorkspaceActions } from './store/workspaceStore'
import { useKeyboardShortcuts, useMenuEvents, useWindowState } from './hooks'
import { collectTerminalIds, splitPaneAtTerminal } from './utils/pane'
import { v4 as uuidv4 } from 'uuid'

const App: React.FC = () => {
  // UI State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [createDialog, setCreateDialog] = useState<{ open: boolean; profileId?: string }>({ open: false })

  // Terminal State
  const [ptyIds, setPtyIds] = useState<Map<string, string>>(new Map())
  const [activePaneTerminalId, setActivePaneTerminalId] = useState<string | null>(null)

  // Stores
  const { tabs, activeTabId, addTab, removeTab, panes, setPane, setActiveTab, updateTabTitle } = useTerminalStore()
  const { settings, profiles, currentTheme } = useSettingsStore()
  const { addWorkspace, activeWorkspaceId } = useWorkspaceStore()

  // Config loading state
  const isConfigLoaded = useIsConfigLoaded()
  const isWorkspacesLoaded = useIsWorkspacesLoaded()
  const { loadFromConfig: loadSettingsConfig } = useSettingsActions()
  const { loadFromConfig: loadWorkspacesConfig } = useWorkspaceActions()

  // Custom Hooks
  const { isMaximized } = useWindowState()
  const isInitialized = useRef(false)

  // Create a new terminal
  const createTerminal = useCallback(async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId) || profiles[0]

    try {
      const ptyId = await window.electronAPI.ptyCreate({
        shell: profile.shell,
        cwd: profile.cwd,
        env: profile.env
      })

      const terminalId = uuidv4()

      setPtyIds(prev => {
        const newMap = new Map(prev)
        newMap.set(terminalId, ptyId)
        return newMap
      })

      // Execute startup command if defined
      if (profile.startupCommand) {
        // Wait a bit for shell to initialize, then send the command
        setTimeout(() => {
          window.electronAPI.ptyWrite(ptyId, profile.startupCommand + '\r')
        }, 300)
      }

      return { terminalId, ptyId }
    } catch (error) {
      console.error('Failed to create terminal:', error)
      throw new Error(`Failed to create terminal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [profiles])

  // Dialog handlers
  const openCreateDialog = useCallback((profileId?: string) => {
    setCreateDialog({ open: true, profileId })
  }, [])

  const closeCreateDialog = useCallback(() => {
    setCreateDialog({ open: false })
  }, [])

  // Tab handlers
  const handleCreateTab = useCallback(async (profileId?: string) => {
    const profileIdToUse = profileId || settings.defaultProfile
    const profile = profiles.find(p => p.id === profileIdToUse) || profiles[0]
    const tabId = addTab(profileIdToUse, profile.name, activeWorkspaceId || undefined)

    try {
      const { terminalId } = await createTerminal(profileIdToUse)

      setPane(tabId, {
        id: uuidv4(),
        type: 'terminal',
        terminalId
      })

      setActivePaneTerminalId(terminalId)
    } catch (error) {
      console.error('Failed to create tab:', error)
      removeTab(tabId)
    }

    closeCreateDialog()
  }, [addTab, createTerminal, settings.defaultProfile, profiles, setPane, activeWorkspaceId, closeCreateDialog, removeTab])

  const handleCloseTab = useCallback((tabId: string) => {
    const pane = panes.get(tabId)
    if (pane) {
      collectTerminalIds(pane).forEach(terminalId => {
        const ptyId = ptyIds.get(terminalId)
        if (ptyId) {
          try {
            window.electronAPI.ptyKill(ptyId)
          } catch (error) {
            console.error('Failed to kill PTY:', error)
          }
          setPtyIds(prev => {
            const newMap = new Map(prev)
            newMap.delete(terminalId)
            return newMap
          })
        }
      })
    }
    removeTab(tabId)
  }, [panes, ptyIds, removeTab])

  // Split handler
  const handleSplit = useCallback(async (direction: 'horizontal' | 'vertical') => {
    if (!activeTabId || !activePaneTerminalId) return

    const currentPane = panes.get(activeTabId)
    if (!currentPane) return

    try {
      const { terminalId: newTerminalId } = await createTerminal(settings.defaultProfile)
      const newPane = splitPaneAtTerminal(currentPane, activePaneTerminalId, direction, newTerminalId)

      if (newPane) {
        setPane(activeTabId, newPane)
        setActivePaneTerminalId(newTerminalId)
      }
    } catch (error) {
      console.error('Failed to split pane:', error)
    }
  }, [activeTabId, activePaneTerminalId, panes, createTerminal, settings.defaultProfile, setPane])

  // Workspace handler
  const handleCreateWorkspace = useCallback((name: string) => {
    addWorkspace(name)
    closeCreateDialog()
  }, [addWorkspace, closeCreateDialog])

  // Terminal handlers
  const handleTerminalFocus = useCallback((terminalId: string) => {
    setActivePaneTerminalId(terminalId)
  }, [])

  const handleTerminalTitleChange = useCallback((terminalId: string, title: string) => {
    // Find the tab that contains this terminal
    for (const [tabId, pane] of panes.entries()) {
      const terminalIds = collectTerminalIds(pane)
      if (terminalIds.includes(terminalId)) {
        updateTabTitle(tabId, title)
        break
      }
    }
  }, [panes, updateTabTitle])

  // Sidebar handler
  const toggleSidebar = useCallback(() => {
    setSidebarExpanded(prev => !prev)
  }, [])

  // Keyboard shortcut handlers
  const keyboardHandlers = useMemo(() => ({
    onNewTab: () => openCreateDialog(),
    onCloseTab: () => activeTabId && handleCloseTab(activeTabId),
    onSplitVertical: () => handleSplit('vertical'),
    onSplitHorizontal: () => handleSplit('horizontal'),
    onToggleSidebar: toggleSidebar,
    onOpenSettings: () => setSettingsOpen(true)
  }), [openCreateDialog, activeTabId, handleCloseTab, handleSplit, toggleSidebar])

  useKeyboardShortcuts(keyboardHandlers)

  // Menu event handlers
  const menuHandlers = useMemo(() => ({
    onNewTab: () => openCreateDialog(),
    onCloseTab: () => activeTabId && handleCloseTab(activeTabId),
    onOpenSettings: () => setSettingsOpen(true),
    onSplitVertical: () => handleSplit('vertical'),
    onSplitHorizontal: () => handleSplit('horizontal')
  }), [openCreateDialog, activeTabId, handleCloseTab, handleSplit])

  useMenuEvents(menuHandlers)

  // Load config from electron-store on startup
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const loadConfig = async () => {
      await Promise.all([
        loadSettingsConfig(),
        loadWorkspacesConfig()
      ])
    }
    loadConfig()
  }, [loadSettingsConfig, loadWorkspacesConfig])

  // Switch to first tab when workspace changes
  useEffect(() => {
    const workspaceTabs = tabs.filter(tab =>
      activeWorkspaceId ? tab.workspaceId === activeWorkspaceId : !tab.workspaceId
    )

    // If current active tab is not in this workspace, switch to first tab
    const currentTabInWorkspace = workspaceTabs.find(t => t.id === activeTabId)
    if (!currentTabInWorkspace && workspaceTabs.length > 0) {
      setActiveTab(workspaceTabs[0].id)
      // Also update the active pane terminal
      const pane = panes.get(workspaceTabs[0].id)
      if (pane && pane.type === 'terminal' && pane.terminalId) {
        setActivePaneTerminalId(pane.terminalId)
      }
    }
  }, [activeWorkspaceId, tabs, activeTabId, setActiveTab, panes])

  // Apply window appearance settings
  useEffect(() => {
    if (window.electronAPI?.setOpacity) {
      window.electronAPI.setOpacity(settings.opacity)
    }
  }, [settings.opacity])

  useEffect(() => {
    if (window.electronAPI?.setBackgroundBlur) {
      window.electronAPI.setBackgroundBlur(settings.blur)
    }
  }, [settings.blur])

  // Apply theme colors to CSS variables
  useEffect(() => {
    const root = document.documentElement
    const bg = currentTheme.colors.background
    // Calculate lighter/darker variants
    const adjustColor = (hex: string, amount: number) => {
      const num = parseInt(hex.replace('#', ''), 16)
      const r = Math.min(255, Math.max(0, (num >> 16) + amount))
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
    }

    root.style.setProperty('--bg-terminal', bg)
    root.style.setProperty('--bg-tabbar', adjustColor(bg, 15))
    root.style.setProperty('--bg-tab-active', bg)
    root.style.setProperty('--bg-tab-hover', adjustColor(bg, 25))
    root.style.setProperty('--text-primary', currentTheme.colors.foreground)

    // Also set body background for corner consistency
    document.body.style.backgroundColor = bg
  }, [currentTheme])

  const activePane = activeTabId ? panes.get(activeTabId) : null

  // Show loading state while config is being loaded
  if (!isConfigLoaded || !isWorkspacesLoaded) {
    return (
      <div className="app-container loading">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-container ${isMaximized ? 'maximized' : ''}`}>
      <TabBar
        onNewTab={openCreateDialog}
        onCreateTab={handleCreateTab}
        onCloseTab={handleCloseTab}
        onToggleSidebar={toggleSidebar}
        sidebarExpanded={sidebarExpanded}
      />

      <div className="app-main">
        <WorkspaceSidebar
          expanded={sidebarExpanded}
          onNewTab={openCreateDialog}
          onCreateTerminal={handleCreateTab}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div className="terminal-container">
          {activePane ? (
            <SplitPane
              pane={activePane}
              onTerminalTitleChange={handleTerminalTitleChange}
              onTerminalFocus={handleTerminalFocus}
              ptyIds={ptyIds}
              activeTerminalId={activePaneTerminalId}
            />
          ) : (
            <div className="terminal-placeholder">
              <div className="terminal-placeholder-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 17l6-6-6-6M12 19h8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>No terminal open</p>
                <span>Use Quick Start or press Ctrl+T</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <CreateDialog
        open={createDialog.open}
        onClose={closeCreateDialog}
        onCreateWorkspace={handleCreateWorkspace}
        onCreateTerminal={() => handleCreateTab(createDialog.profileId)}
      />
    </div>
  )
}

export default App
