import React, { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react'
import { TabBar } from './components/TabBar/TabBar'
import { WorkspaceSidebar } from './components/WorkspaceSidebar/WorkspaceSidebar'
import { SplitPane } from './components/SplitPane/SplitPane'
import { CreateDialog } from './components/CreateDialog/CreateDialog'
import { ToastContainer } from './components/Toast/Toast'
import { SessionRestoreDialog } from './components/SessionRestoreDialog/SessionRestoreDialog'
import { PerfMonitor } from './components/DevTools/PerfMonitor'
import { TerminalErrorBoundary } from './components/ErrorBoundary/TerminalErrorBoundary'
import { PanelErrorBoundary } from './components/ErrorBoundary/PanelErrorBoundary'
import { useTerminalTabs, useActiveTabId, useTerminalPanes, useTerminalActions } from './store/terminalStore'
import { useActiveWorkspaceId, useWorkspaceActions } from './store/workspaceStore'
import { getActivePaneId } from './store/activePaneStore'
import {
  useKeyboardShortcuts,
  useMenuEvents,
  useWindowState,
  useTerminalManager,
  useSessionManager,
  useThemeManager
} from './hooks'

// Lazy loaded modal components
const Settings = lazy(() => import('./components/Settings/Settings').then((m) => ({ default: m.Settings })))
const CommandPalette = lazy(() =>
  import('./components/CommandPalette/CommandPalette').then((m) => ({ default: m.CommandPalette }))
)
const UpdateDialog = lazy(() =>
  import('./components/UpdateDialog/UpdateDialog').then((m) => ({ default: m.UpdateDialog }))
)
const SnippetManager = lazy(() =>
  import('./components/SnippetManager/SnippetManager').then((m) => ({ default: m.SnippetManager }))
)

const App: React.FC = () => {
  // UI State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [createDialog, setCreateDialog] = useState<{ open: boolean; profileId?: string }>({ open: false })
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [snippetManagerOpen, setSnippetManagerOpen] = useState(false)

  // Stores
  const tabs = useTerminalTabs()
  const activeTabId = useActiveTabId()
  const panes = useTerminalPanes()
  const { setActiveTab } = useTerminalActions()
  const activeWorkspaceId = useActiveWorkspaceId()
  const { addWorkspace } = useWorkspaceActions()

  // When workspace changes, ensure active tab belongs to that workspace
  useEffect(() => {
    if (!activeTabId) return

    const activeTab = tabs.find((t) => t.id === activeTabId)
    const tabBelongsToView =
      activeTab && (activeWorkspaceId ? activeTab.workspaceId === activeWorkspaceId : !activeTab.workspaceId)

    if (!tabBelongsToView) {
      const validTab = tabs.find((t) => (activeWorkspaceId ? t.workspaceId === activeWorkspaceId : !t.workspaceId))
      if (validTab) {
        setActiveTab(validTab.id)
      }
    }
  }, [activeWorkspaceId, tabs, activeTabId, setActiveTab])

  // Custom Hooks
  const { isMaximized } = useWindowState()
  useThemeManager()

  // Terminal Manager
  const {
    ptyIds,
    maximizedPaneId,
    handleCreateTab,
    handleCloseTab,
    handleSplit,
    handleApplyLayout,
    handleNavigatePane,
    handleClosePane,
    handleNextTab,
    handlePrevTab,
    handleReopenClosedTab,
    handleToggleMaximize,
    setActivePaneTerminalId
  } = useTerminalManager()

  // Session Manager
  const { isConfigLoaded, isWorkspacesLoaded, showRestoreDialog, savedTabCount, handleRestore, handleDismiss } =
    useSessionManager({ handleCreateTab })

  // Dialog handlers
  const openCreateDialog = useCallback((profileId?: string) => {
    setCreateDialog({ open: true, profileId })
  }, [])

  const closeCreateDialog = useCallback(() => {
    setCreateDialog({ open: false })
  }, [])

  const handleCreateWorkspace = useCallback(
    (name: string) => {
      addWorkspace(name)
      closeCreateDialog()
    },
    [addWorkspace, closeCreateDialog]
  )

  const toggleSidebar = useCallback(() => {
    setSidebarExpanded((prev) => !prev)
  }, [])

  const toggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen((prev) => !prev)
  }, [])

  // Tab title change handler (disabled - keeps profile names)
  const handleTerminalTitleChange = useCallback((_terminalId: string, _title: string) => {
    // Tab titles are set from profile name and won't change
  }, [])

  // Keyboard shortcut handlers
  const keyboardHandlers = useMemo(
    () => ({
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
      onReopenClosedTab: handleReopenClosedTab,
      onToggleMaximize: handleToggleMaximize,
      onOpenSnippets: () => setSnippetManagerOpen(true)
    }),
    [
      openCreateDialog,
      activeTabId,
      handleCloseTab,
      handleSplit,
      toggleSidebar,
      handleNextTab,
      handlePrevTab,
      handleNavigatePane,
      handleClosePane,
      toggleCommandPalette,
      handleReopenClosedTab,
      handleToggleMaximize
    ]
  )

  useKeyboardShortcuts(keyboardHandlers)

  // Menu event handlers
  const menuHandlers = useMemo(
    () => ({
      onNewTab: () => openCreateDialog(),
      onCloseTab: () => activeTabId && handleCloseTab(activeTabId),
      onOpenSettings: () => setSettingsOpen(true),
      onSplitVertical: () => handleSplit('vertical'),
      onSplitHorizontal: () => handleSplit('horizontal'),
      onNextTab: handleNextTab,
      onPrevTab: handlePrevTab
    }),
    [openCreateDialog, activeTabId, handleCloseTab, handleSplit, handleNextTab, handlePrevTab]
  )

  useMenuEvents(menuHandlers)

  // Switch to first tab when workspace changes
  useEffect(() => {
    const workspaceTabs = tabs.filter((tab) =>
      activeWorkspaceId ? tab.workspaceId === activeWorkspaceId : !tab.workspaceId
    )

    const currentTabInWorkspace = workspaceTabs.find((t) => t.id === activeTabId)
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
    const activeTab = tabs.find((t) => t.id === activeTabId)
    if (activeTab && window.electronAPI?.setWindowTitle) {
      window.electronAPI.setWindowTitle(`${activeTab.title} - VoidTerm`)
    } else if (window.electronAPI?.setWindowTitle) {
      window.electronAPI.setWindowTitle('VoidTerm')
    }
  }, [tabs, activeTabId])

  // Check for updates after a short delay
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (window.electronAPI?.updates) {
        try {
          const result = await window.electronAPI.updates.checkForUpdates()
          if (result.updateAvailable) {
            setUpdateDialogOpen(true)
          }
        } catch {
          /* ignore in dev */
        }
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  // Only show terminal if active tab belongs to current workspace view
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const activeTabBelongsToView =
    activeTab && (activeWorkspaceId ? activeTab.workspaceId === activeWorkspaceId : !activeTab.workspaceId)
  const activePane = activeTabBelongsToView && activeTabId ? panes.get(activeTabId) : null

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
      <PanelErrorBoundary panelName="Tab Bar" onReset={() => {}}>
        <TabBar
          onNewTab={openCreateDialog}
          onCreateTab={handleCreateTab}
          onCloseTab={handleCloseTab}
          onToggleSidebar={toggleSidebar}
          sidebarExpanded={sidebarExpanded}
          onApplyLayout={handleApplyLayout}
        />
      </PanelErrorBoundary>

      <div className="app-main">
        <PanelErrorBoundary panelName="Workspace Sidebar" onReset={() => setSidebarExpanded(false)}>
          <WorkspaceSidebar
            expanded={sidebarExpanded}
            onNewTab={openCreateDialog}
            onCreateTerminal={handleCreateTab}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </PanelErrorBoundary>

        <div className="terminal-area">
          <div className="terminal-container">
            {activePane ? (
              <TerminalErrorBoundary>
                <SplitPane
                  pane={activePane}
                  onTerminalTitleChange={handleTerminalTitleChange}
                  ptyIds={ptyIds}
                  onNavigatePane={handleNavigatePane}
                  onClosePane={handleClosePane}
                  onNextTab={handleNextTab}
                  onPrevTab={handlePrevTab}
                  maximizedPaneId={maximizedPaneId}
                  onToggleMaximize={handleToggleMaximize}
                />
              </TerminalErrorBoundary>
            ) : (
              <div className="terminal-placeholder">
                <div className="terminal-placeholder-content">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 17l6-6-6-6M12 19h8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p>No terminal open</p>
                  <span>Use Quick Start or press Ctrl+T</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {settingsOpen && (
        <PanelErrorBoundary panelName="Settings" onReset={() => setSettingsOpen(false)}>
          <Suspense fallback={null}>
            <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
          </Suspense>
        </PanelErrorBoundary>
      )}

      <CreateDialog
        open={createDialog.open}
        onClose={closeCreateDialog}
        onCreateWorkspace={handleCreateWorkspace}
        onCreateTerminal={(profileId) => handleCreateTab(profileId)}
      />

      {commandPaletteOpen && (
        <PanelErrorBoundary panelName="Command Palette" onReset={() => setCommandPaletteOpen(false)}>
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
              onOpenSnippets={() => setSnippetManagerOpen(true)}
            />
          </Suspense>
        </PanelErrorBoundary>
      )}

      {snippetManagerOpen && (
        <PanelErrorBoundary panelName="Snippet Manager" onReset={() => setSnippetManagerOpen(false)}>
          <Suspense fallback={null}>
            <SnippetManager
              isOpen={snippetManagerOpen}
              onClose={() => setSnippetManagerOpen(false)}
              activePtyId={ptyIds.get(getActivePaneId() || '')}
            />
          </Suspense>
        </PanelErrorBoundary>
      )}

      {updateDialogOpen && (
        <Suspense fallback={null}>
          <UpdateDialog isOpen={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} />
        </Suspense>
      )}

      <SessionRestoreDialog
        isOpen={showRestoreDialog}
        tabCount={savedTabCount}
        onRestore={handleRestore}
        onDismiss={handleDismiss}
      />

      <ToastContainer />
      {import.meta.env.DEV && <PerfMonitor />}
    </div>
  )
}

export default App
