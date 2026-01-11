import React, { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react'
import { TabBar } from './components/TabBar/TabBar'
import { WorkspaceSidebar } from './components/WorkspaceSidebar/WorkspaceSidebar'
import { SplitPane } from './components/SplitPane/SplitPane'
import { CreateDialog } from './components/CreateDialog/CreateDialog'
import { BroadcastConfirmDialog } from './components/BroadcastConfirmDialog/BroadcastConfirmDialog'
import { ToastContainer } from './components/Toast/Toast'
import { useTerminalStore } from './store/terminalStore'
import { useWorkspaceStore } from './store/workspaceStore'
import {
  useKeyboardShortcuts,
  useMenuEvents,
  useWindowState,
  useTerminalManager,
  useSessionManager,
  useThemeManager,
  useSSHManager
} from './hooks'

// Lazy loaded modal bileşenler
const Settings = lazy(() => import('./components/Settings/Settings').then(m => ({ default: m.Settings })))
const CommandPalette = lazy(() => import('./components/CommandPalette/CommandPalette').then(m => ({ default: m.CommandPalette })))
const SSHManager = lazy(() => import('./components/SSHManager/SSHManager').then(m => ({ default: m.SSHManager })))

const App: React.FC = () => {
  // UI State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [createDialog, setCreateDialog] = useState<{ open: boolean; profileId?: string }>({ open: false })
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [broadcastConfirmOpen, setBroadcastConfirmOpen] = useState(false)

  // Stores
  const { tabs, activeTabId, panes, setActiveTab, broadcastMode, toggleBroadcastMode } = useTerminalStore()
  const { addWorkspace, activeWorkspaceId } = useWorkspaceStore()

  // Custom Hooks
  const { isMaximized } = useWindowState()
  useThemeManager()

  // Terminal Manager
  const {
    ptyIds,
    activePaneTerminalId,
    maximizedPaneId,
    handleCreateTab,
    handleCloseTab,
    handleSplit,
    handleNavigatePane,
    handleClosePane,
    handleTerminalFocus,
    handleBroadcastInput,
    handleNextTab,
    handlePrevTab,
    handleReopenClosedTab,
    handleToggleMaximize,
    setActivePaneTerminalId,
    setPtyIds
  } = useTerminalManager()

  // Session Manager
  const { isConfigLoaded, isWorkspacesLoaded } = useSessionManager({ handleCreateTab })

  // SSH Manager
  const { sshManagerOpen, setSSHManagerOpen, handleSSHConnect } = useSSHManager({
    setPtyIds,
    setActivePaneTerminalId
  })

  // Dialog handlers
  const openCreateDialog = useCallback((profileId?: string) => {
    setCreateDialog({ open: true, profileId })
  }, [])

  const closeCreateDialog = useCallback(() => {
    setCreateDialog({ open: false })
  }, [])

  // Workspace handler
  const handleCreateWorkspace = useCallback((name: string) => {
    addWorkspace(name)
    closeCreateDialog()
  }, [addWorkspace, closeCreateDialog])

  // Sidebar handler
  const toggleSidebar = useCallback(() => {
    setSidebarExpanded(prev => !prev)
  }, [])

  // Command palette toggle
  const toggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen(prev => !prev)
  }, [])

  // Broadcast mode handlers
  const handleToggleBroadcast = useCallback(() => {
    if (broadcastMode) {
      // If already ON, turn OFF directly without confirmation
      toggleBroadcastMode()
    } else {
      // If OFF, show confirmation dialog before turning ON
      setBroadcastConfirmOpen(true)
    }
  }, [broadcastMode, toggleBroadcastMode])

  const handleBroadcastConfirm = useCallback(() => {
    toggleBroadcastMode()
    setBroadcastConfirmOpen(false)
  }, [toggleBroadcastMode])

  const handleBroadcastCancel = useCallback(() => {
    setBroadcastConfirmOpen(false)
  }, [])

  // Tab title change handler (disabled - keeps profile names)
  const handleTerminalTitleChange = useCallback((_terminalId: string, _title: string) => {
    // Tab titles are set from profile name and won't change
  }, [])

  // Keyboard shortcut handlers
  const keyboardHandlers = useMemo(() => ({
    onNewTab: () => openCreateDialog(),
    onCloseTab: () => activeTabId && handleCloseTab(activeTabId),
    onSplitVertical: () => handleSplit('vertical'),
    onSplitHorizontal: () => handleSplit('horizontal'),
    onToggleSidebar: toggleSidebar,
    onOpenSettings: () => setSettingsOpen(true),
    onNextTab: handleNextTab,
    onPrevTab: handlePrevTab,
    onNavigatePane: handleNavigatePane,
    onClosePane: handleClosePane,
    onCommandPalette: toggleCommandPalette,
    onToggleBroadcast: handleToggleBroadcast,
    onReopenClosedTab: handleReopenClosedTab,
    onToggleMaximize: handleToggleMaximize
  }), [
    openCreateDialog, activeTabId, handleCloseTab, handleSplit, toggleSidebar,
    handleNextTab, handlePrevTab, handleNavigatePane, handleClosePane,
    toggleCommandPalette, handleToggleBroadcast, handleReopenClosedTab, handleToggleMaximize
  ])

  useKeyboardShortcuts(keyboardHandlers)

  // Menu event handlers
  const menuHandlers = useMemo(() => ({
    onNewTab: () => openCreateDialog(),
    onCloseTab: () => activeTabId && handleCloseTab(activeTabId),
    onOpenSettings: () => setSettingsOpen(true),
    onSplitVertical: () => handleSplit('vertical'),
    onSplitHorizontal: () => handleSplit('horizontal'),
    onNextTab: handleNextTab,
    onPrevTab: handlePrevTab
  }), [openCreateDialog, activeTabId, handleCloseTab, handleSplit, handleNextTab, handlePrevTab])

  useMenuEvents(menuHandlers)

  // Switch to first tab when workspace changes
  useEffect(() => {
    const workspaceTabs = tabs.filter(tab =>
      activeWorkspaceId ? tab.workspaceId === activeWorkspaceId : !tab.workspaceId
    )

    const currentTabInWorkspace = workspaceTabs.find(t => t.id === activeTabId)
    if (!currentTabInWorkspace && workspaceTabs.length > 0) {
      setActiveTab(workspaceTabs[0].id)
      const pane = panes.get(workspaceTabs[0].id)
      if (pane && pane.type === 'terminal' && pane.terminalId) {
        setActivePaneTerminalId(pane.terminalId)
      }
    }
  }, [activeWorkspaceId, tabs, activeTabId, setActiveTab, panes, setActivePaneTerminalId])

  // Update window title when active tab changes
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId)
    if (activeTab && window.electronAPI?.setWindowTitle) {
      window.electronAPI.setWindowTitle(`${activeTab.title} - VoidTerm`)
    } else if (window.electronAPI?.setWindowTitle) {
      window.electronAPI.setWindowTitle('VoidTerm')
    }
  }, [tabs, activeTabId])

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
              onNavigatePane={handleNavigatePane}
              onClosePane={handleClosePane}
              onNextTab={handleNextTab}
              onPrevTab={handlePrevTab}
              broadcastMode={broadcastMode}
              onBroadcastInput={handleBroadcastInput}
              maximizedPaneId={maximizedPaneId}
              onToggleMaximize={handleToggleMaximize}
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

      {settingsOpen && (
        <Suspense fallback={null}>
          <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </Suspense>
      )}

      <CreateDialog
        open={createDialog.open}
        onClose={closeCreateDialog}
        onCreateWorkspace={handleCreateWorkspace}
        onCreateTerminal={() => handleCreateTab(createDialog.profileId)}
      />

      {commandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            onNewTab={handleCreateTab}
            onSplitVertical={() => handleSplit('vertical')}
            onSplitHorizontal={() => handleSplit('horizontal')}
            onCloseTab={() => activeTabId && handleCloseTab(activeTabId)}
            onClosePane={handleClosePane}
            onToggleSidebar={toggleSidebar}
            onOpenSettings={() => setSettingsOpen(true)}
            onNextTab={handleNextTab}
            onPrevTab={handlePrevTab}
            onOpenSSHManager={() => setSSHManagerOpen(true)}
          />
        </Suspense>
      )}

      {sshManagerOpen && (
        <Suspense fallback={null}>
          <SSHManager
            isOpen={sshManagerOpen}
            onClose={() => setSSHManagerOpen(false)}
            onConnect={handleSSHConnect}
          />
        </Suspense>
      )}

      <BroadcastConfirmDialog
        open={broadcastConfirmOpen}
        onConfirm={handleBroadcastConfirm}
        onCancel={handleBroadcastCancel}
      />

      <ToastContainer />
    </div>
  )
}

export default App
