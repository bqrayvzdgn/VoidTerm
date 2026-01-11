import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { TabBar } from './components/TabBar/TabBar'
import { WorkspaceSidebar } from './components/WorkspaceSidebar/WorkspaceSidebar'
import { SplitPane } from './components/SplitPane/SplitPane'
import { Settings } from './components/Settings/Settings'
import { CreateDialog } from './components/CreateDialog/CreateDialog'
import { CommandPalette } from './components/CommandPalette/CommandPalette'
import { SSHManager } from './components/SSHManager/SSHManager'
import type { SSHConnection } from './types'
import { useTerminalStore } from './store/terminalStore'
import { useSettingsStore, useIsConfigLoaded, useSettingsActions } from './store/settingsStore'
import { useWorkspaceStore, useIsWorkspacesLoaded, useWorkspaceActions } from './store/workspaceStore'
import { useKeyboardShortcuts, useMenuEvents, useWindowState } from './hooks'
import { collectTerminalIds, splitPaneAtTerminal, findNextPane, removePaneAtTerminal } from './utils/pane'
import { v4 as uuidv4 } from 'uuid'

const App: React.FC = () => {
  // UI State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [createDialog, setCreateDialog] = useState<{ open: boolean; profileId?: string }>({ open: false })
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [sshManagerOpen, setSSHManagerOpen] = useState(false)

  // Terminal State
  const [ptyIds, setPtyIds] = useState<Map<string, string>>(new Map())
  const [activePaneTerminalId, setActivePaneTerminalId] = useState<string | null>(null)

  // Stores
  const { tabs, activeTabId, addTab, removeTab, panes, setPane, setActiveTab, updateTabTitle, broadcastMode, toggleBroadcastMode } = useTerminalStore()
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

  // SSH connection handler
  const handleSSHConnect = useCallback(async (connection: SSHConnection) => {
    // Create SSH connection command
    let sshCommand = `ssh ${connection.username}@${connection.host}`
    
    if (connection.port !== 22) {
      sshCommand += ` -p ${connection.port}`
    }
    
    if (connection.authMethod === 'key' && connection.privateKeyPath) {
      sshCommand += ` -i "${connection.privateKeyPath}"`
    }
    
    if (connection.jumpHost) {
      sshCommand += ` -J ${connection.jumpHost}`
    }

    // Find or create SSH profile
    let sshProfile = profiles.find(p => p.shell.toLowerCase().includes('ssh'))
    if (!sshProfile) {
      sshProfile = profiles[0] // Use default profile
    }

    // Create a new tab with SSH profile
    const tabId = addTab(sshProfile?.id || 'default', `SSH: ${connection.name}`, activeWorkspaceId || undefined)

    try {
      const ptyId = await window.electronAPI.ptyCreate({
        shell: sshProfile?.shell || 'cmd.exe',
        cwd: sshProfile?.cwd,
        env: sshProfile?.env
      })

      const terminalId = uuidv4()

      setPtyIds(prev => {
        const newMap = new Map(prev)
        newMap.set(terminalId, ptyId)
        return newMap
      })

      setPane(tabId, {
        id: uuidv4(),
        type: 'terminal',
        terminalId
      })

      setActivePaneTerminalId(terminalId)

      // Execute SSH command after shell is ready
      setTimeout(() => {
        window.electronAPI.ptyWrite(ptyId, sshCommand + '\r')
      }, 500)

    } catch (error) {
      console.error('Failed to create SSH terminal:', error)
    }
  }, [profiles, addTab, activeWorkspaceId, setPane])

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
    if (!title || title.trim() === '') return
    
    // Extract meaningful title from shell output
    let cleanTitle = title.trim()
    
    // For Windows paths like "C:\Users\void\Projects" - extract last folder
    const windowsPathMatch = cleanTitle.match(/^[A-Z]:\\(.+)$/i)
    if (windowsPathMatch) {
      const parts = windowsPathMatch[1].split('\\')
      cleanTitle = parts[parts.length - 1] || parts[parts.length - 2] || cleanTitle
    }
    
    // For Unix paths like "/home/user/projects" - extract last folder
    const unixPathMatch = cleanTitle.match(/^\/(.+)$/)
    if (unixPathMatch) {
      const parts = unixPathMatch[1].split('/')
      cleanTitle = parts[parts.length - 1] || parts[parts.length - 2] || cleanTitle
    }
    
    // For "user@host: path" format - extract path part
    const sshStyleMatch = cleanTitle.match(/^.+@.+:\s*(.+)$/)
    if (sshStyleMatch) {
      cleanTitle = sshStyleMatch[1]
      // If it's still a path, extract last folder
      if (cleanTitle.includes('/')) {
        const parts = cleanTitle.split('/')
        cleanTitle = parts[parts.length - 1] || parts[parts.length - 2] || cleanTitle
      }
    }
    
    // Skip if it's too long (likely a full command)
    if (cleanTitle.length > 30) return
    
    // Skip common command prefixes that shouldn't be titles
    const skipPatterns = [
      /^(git|npm|node|yarn|pnpm|docker|kubectl)\s+\w+/i,
      /^\$\s+/,  // Shell prompt
      /^>\s+/,   // PowerShell prompt
    ]
    if (skipPatterns.some(p => p.test(cleanTitle))) return
    
    // Find the tab that contains this terminal
    for (const [tabId, pane] of panes.entries()) {
      const terminalIds = collectTerminalIds(pane)
      if (terminalIds.includes(terminalId)) {
        updateTabTitle(tabId, cleanTitle)
        break
      }
    }
  }, [panes, updateTabTitle])

  // Sidebar handler
  const toggleSidebar = useCallback(() => {
    setSidebarExpanded(prev => !prev)
  }, [])

  // Tab navigation handlers
  const handleNextTab = useCallback(() => {
    const workspaceTabs = tabs.filter(tab =>
      activeWorkspaceId ? tab.workspaceId === activeWorkspaceId : !tab.workspaceId
    )
    if (workspaceTabs.length <= 1) return
    
    const currentIndex = workspaceTabs.findIndex(t => t.id === activeTabId)
    const nextIndex = (currentIndex + 1) % workspaceTabs.length
    const nextTab = workspaceTabs[nextIndex]
    
    setActiveTab(nextTab.id)
    const pane = panes.get(nextTab.id)
    if (pane) {
      const terminalIds = collectTerminalIds(pane)
      if (terminalIds.length > 0) {
        setActivePaneTerminalId(terminalIds[0])
      }
    }
  }, [tabs, activeWorkspaceId, activeTabId, setActiveTab, panes])

  const handlePrevTab = useCallback(() => {
    const workspaceTabs = tabs.filter(tab =>
      activeWorkspaceId ? tab.workspaceId === activeWorkspaceId : !tab.workspaceId
    )
    if (workspaceTabs.length <= 1) return
    
    const currentIndex = workspaceTabs.findIndex(t => t.id === activeTabId)
    const prevIndex = (currentIndex - 1 + workspaceTabs.length) % workspaceTabs.length
    const prevTab = workspaceTabs[prevIndex]
    
    setActiveTab(prevTab.id)
    const pane = panes.get(prevTab.id)
    if (pane) {
      const terminalIds = collectTerminalIds(pane)
      if (terminalIds.length > 0) {
        setActivePaneTerminalId(terminalIds[0])
      }
    }
  }, [tabs, activeWorkspaceId, activeTabId, setActiveTab, panes])

  // Pane navigation handler
  const handleNavigatePane = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!activeTabId || !activePaneTerminalId) return
    
    const currentPane = panes.get(activeTabId)
    if (!currentPane) return
    
    const nextTerminalId = findNextPane(currentPane, activePaneTerminalId, direction)
    if (nextTerminalId) {
      setActivePaneTerminalId(nextTerminalId)
    }
  }, [activeTabId, activePaneTerminalId, panes])

  // Close active pane handler
  const handleClosePane = useCallback(() => {
    if (!activeTabId || !activePaneTerminalId) return
    
    const currentPane = panes.get(activeTabId)
    if (!currentPane) return
    
    const terminalIds = collectTerminalIds(currentPane)
    
    // If only one terminal, close the whole tab
    if (terminalIds.length <= 1) {
      handleCloseTab(activeTabId)
      return
    }
    
    // Kill the PTY for the closing terminal
    const ptyId = ptyIds.get(activePaneTerminalId)
    if (ptyId) {
      try {
        window.electronAPI.ptyKill(ptyId)
      } catch (error) {
        console.error('Failed to kill PTY:', error)
      }
      setPtyIds(prev => {
        const newMap = new Map(prev)
        newMap.delete(activePaneTerminalId)
        return newMap
      })
    }
    
    // Remove the pane from the tree
    const newPane = removePaneAtTerminal(currentPane, activePaneTerminalId)
    if (newPane) {
      setPane(activeTabId, newPane)
      
      // Set focus to a remaining terminal
      const remainingTerminals = collectTerminalIds(newPane)
      if (remainingTerminals.length > 0) {
        setActivePaneTerminalId(remainingTerminals[0])
      }
    }
  }, [activeTabId, activePaneTerminalId, panes, ptyIds, handleCloseTab, setPane])

  // Command palette toggle
  const toggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen(prev => !prev)
  }, [])

  // Broadcast input to all other terminals in current tab
  const handleBroadcastInput = useCallback((data: string) => {
    if (!activeTabId || !activePaneTerminalId) return
    
    const currentPane = panes.get(activeTabId)
    if (!currentPane) return
    
    // Get all terminal IDs from current pane
    const terminalIds = collectTerminalIds(currentPane)
    
    // Write to all terminals except the source
    terminalIds.forEach(terminalId => {
      if (terminalId !== activePaneTerminalId) {
        const ptyId = ptyIds.get(terminalId)
        if (ptyId) {
          window.electronAPI.ptyWrite(ptyId, data)
        }
      }
    })
  }, [activeTabId, activePaneTerminalId, panes, ptyIds])

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
    onToggleBroadcast: toggleBroadcastMode
  }), [openCreateDialog, activeTabId, handleCloseTab, handleSplit, toggleSidebar, handleNextTab, handlePrevTab, handleNavigatePane, handleClosePane, toggleCommandPalette, toggleBroadcastMode])

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

  // Load config and restore session on startup
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const loadConfig = async () => {
      await Promise.all([
        loadSettingsConfig(),
        loadWorkspacesConfig()
      ])

      // Restore session
      try {
        const session = await window.electronAPI.config.getSession()
        if (session && session.tabs.length > 0) {
          // Restore tabs from session
          for (const savedTab of session.tabs) {
            try {
              await handleCreateTab(savedTab.profileId)
            } catch (error) {
              console.error('Failed to restore tab:', error)
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
      }
    }
    loadConfig()
  }, [loadSettingsConfig, loadWorkspacesConfig, handleCreateTab])

  // Save session before window closes
  useEffect(() => {
    const saveSession = () => {
      const sessionTabs = tabs.map(tab => ({
        id: tab.id,
        profileId: tab.profileId,
        workspaceId: tab.workspaceId,
        title: tab.title
      }))
      
      window.electronAPI.config.saveSession({
        tabs: sessionTabs,
        activeTabId
      })
    }

    window.addEventListener('beforeunload', saveSession)
    return () => window.removeEventListener('beforeunload', saveSession)
  }, [tabs, activeTabId])

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

  // Update window title when active tab changes
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId)
    if (activeTab && window.electronAPI?.setWindowTitle) {
      window.electronAPI.setWindowTitle(`${activeTab.title} - VoidTerm`)
    } else if (window.electronAPI?.setWindowTitle) {
      window.electronAPI.setWindowTitle('VoidTerm')
    }
  }, [tabs, activeTabId])

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
              onNavigatePane={handleNavigatePane}
              onClosePane={handleClosePane}
              onNextTab={handleNextTab}
              onPrevTab={handlePrevTab}
              broadcastMode={broadcastMode}
              onBroadcastInput={handleBroadcastInput}
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

      <SSHManager
        isOpen={sshManagerOpen}
        onClose={() => setSSHManagerOpen(false)}
        onConnect={handleSSHConnect}
      />
    </div>
  )
}

export default App
