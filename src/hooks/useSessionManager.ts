import { useEffect, useState, useCallback } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import { useSettingsStore, useIsConfigLoaded, useSettingsActions } from '../store/settingsStore'
import { useWorkspaceStore, useIsWorkspacesLoaded, useWorkspaceActions } from '../store/workspaceStore'
import { useToastStore } from '../store/toastStore'
import { createLogger } from '../utils/logger'

const logger = createLogger('SessionManager')

interface UseSessionManagerProps {
  handleCreateTab: (profileId?: string, workspaceId?: string | null) => Promise<void>
}

// Module-level flags to prevent double initialization in StrictMode
let isInitialized = false
let sessionRestored = false

// Reset flags on module reload (HMR)
const hot = (import.meta as { hot?: { dispose: (cb: () => void) => void } }).hot
if (hot) {
  hot.dispose(() => {
    isInitialized = false
    sessionRestored = false
  })
}

interface SavedSession {
  tabs: Array<{ id: string; profileId: string; workspaceId?: string; title: string }>
  activeTabId?: string | null
  activeWorkspaceId?: string
}

export const useSessionManager = ({ handleCreateTab }: UseSessionManagerProps) => {
  const { tabs, activeTabId } = useTerminalStore()
  const { profiles } = useSettingsStore()
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()

  const isConfigLoaded = useIsConfigLoaded()
  const isWorkspacesLoaded = useIsWorkspacesLoaded()
  const { loadFromConfig: loadSettingsConfig } = useSettingsActions()
  const { loadFromConfig: loadWorkspacesConfig } = useWorkspaceActions()

  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [savedTabCount, setSavedTabCount] = useState(0)
  const [pendingSession, setPendingSession] = useState<SavedSession | null>(null)

  // Load config on startup
  useEffect(() => {
    if (isInitialized) return
    isInitialized = true

    Promise.all([loadSettingsConfig(), loadWorkspacesConfig()]).catch((error) => {
      logger.error('Failed to load config:', error)
      useToastStore.getState().warning('Failed to load configuration. Using defaults.')
    })
  }, [loadSettingsConfig, loadWorkspacesConfig])

  // Check for saved session after config is loaded
  useEffect(() => {
    if (!isConfigLoaded || !isWorkspacesLoaded || sessionRestored || profiles.length === 0) return
    sessionRestored = true

    const checkSession = async () => {
      const workspaces = useWorkspaceStore.getState().workspaces
      const workspaceIds = new Set(workspaces.map((w) => w.id))

      try {
        const session = await window.electronAPI.config.getSession()

        if (session && session.tabs.length > 0) {
          const validWorkspaceTabs = session.tabs.filter((tab) => tab.workspaceId && workspaceIds.has(tab.workspaceId))

          if (validWorkspaceTabs.length > 0) {
            setPendingSession({ ...session, tabs: validWorkspaceTabs })
            setSavedTabCount(validWorkspaceTabs.length)
            setShowRestoreDialog(true)
            return
          }
        }
      } catch (error) {
        logger.error('Failed to check session:', error)
      }

      // No session to restore, create default tab
      try {
        await handleCreateTab(undefined, null)
      } catch (error) {
        logger.error('Failed to create default tab:', error)
      }
    }
    checkSession()
  }, [isConfigLoaded, isWorkspacesLoaded, profiles.length, handleCreateTab, setActiveWorkspace])

  const handleRestore = useCallback(async () => {
    setShowRestoreDialog(false)

    if (pendingSession) {
      const workspaces = useWorkspaceStore.getState().workspaces
      const workspaceIds = new Set(workspaces.map((w) => w.id))

      for (const savedTab of pendingSession.tabs) {
        try {
          await handleCreateTab(savedTab.profileId, savedTab.workspaceId)
        } catch (error) {
          logger.error('Failed to restore tab:', error)
        }
      }

      if (pendingSession.activeWorkspaceId && workspaceIds.has(pendingSession.activeWorkspaceId)) {
        setActiveWorkspace(pendingSession.activeWorkspaceId)
      } else if (pendingSession.tabs[0]?.workspaceId) {
        setActiveWorkspace(pendingSession.tabs[0].workspaceId)
      }

      setPendingSession(null)
    }

    // Ensure at least one tab exists
    const currentTabs = useTerminalStore.getState().tabs
    if (currentTabs.length === 0) {
      try {
        await handleCreateTab(undefined, null)
      } catch (error) {
        logger.error('Failed to create default tab:', error)
      }
    }
  }, [pendingSession, handleCreateTab, setActiveWorkspace])

  const handleDismiss = useCallback(async () => {
    setShowRestoreDialog(false)
    setPendingSession(null)

    // Start fresh with a default tab
    try {
      await handleCreateTab(undefined, null)
    } catch (error) {
      logger.error('Failed to create default tab:', error)
    }
  }, [handleCreateTab])

  // Save session before window closes (with buffer persistence)
  useEffect(() => {
    const saveSession = () => {
      // Only save tabs that belong to a workspace
      const sessionTabs = tabs
        .filter((tab) => tab.workspaceId)
        .map((tab) => ({
          id: tab.id,
          profileId: tab.profileId,
          workspaceId: tab.workspaceId,
          title: tab.title
        }))

      window.electronAPI.config.saveSession({
        tabs: sessionTabs,
        activeTabId,
        activeWorkspaceId: activeWorkspaceId || undefined
      })

      // Save terminal buffers is handled by TerminalView's serialize method
      // through the TerminalViewHandle refs, triggered via the electronAPI
    }

    window.addEventListener('beforeunload', saveSession)
    return () => window.removeEventListener('beforeunload', saveSession)
  }, [tabs, activeTabId, activeWorkspaceId])

  return {
    isConfigLoaded,
    isWorkspacesLoaded,
    showRestoreDialog,
    savedTabCount,
    handleRestore,
    handleDismiss
  }
}
