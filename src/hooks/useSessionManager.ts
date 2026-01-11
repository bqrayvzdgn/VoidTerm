import { useEffect } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import { useSettingsStore, useIsConfigLoaded, useSettingsActions } from '../store/settingsStore'
import { useWorkspaceStore, useIsWorkspacesLoaded, useWorkspaceActions } from '../store/workspaceStore'

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

export const useSessionManager = ({ handleCreateTab }: UseSessionManagerProps) => {
  const { tabs, activeTabId } = useTerminalStore()
  const { profiles } = useSettingsStore()
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()
  
  const isConfigLoaded = useIsConfigLoaded()
  const isWorkspacesLoaded = useIsWorkspacesLoaded()
  const { loadFromConfig: loadSettingsConfig } = useSettingsActions()
  const { loadFromConfig: loadWorkspacesConfig } = useWorkspaceActions()

  // Load config on startup
  useEffect(() => {
    if (isInitialized) return
    isInitialized = true

    Promise.all([
      loadSettingsConfig(),
      loadWorkspacesConfig()
    ])
  }, [loadSettingsConfig, loadWorkspacesConfig])

  // Restore session after config is loaded
  useEffect(() => {
    if (!isConfigLoaded || !isWorkspacesLoaded || sessionRestored || profiles.length === 0) return
    sessionRestored = true

    const restoreSession = async () => {
      const workspaces = useWorkspaceStore.getState().workspaces
      const workspaceIds = new Set(workspaces.map(w => w.id))

      try {
        const session = await window.electronAPI.config.getSession()

        if (session && session.tabs.length > 0) {
          // Only restore tabs that belong to an EXISTING workspace
          const validWorkspaceTabs = session.tabs.filter(
            tab => tab.workspaceId && workspaceIds.has(tab.workspaceId)
          )

          if (validWorkspaceTabs.length > 0) {
            // Restore workspace tabs
            for (const savedTab of validWorkspaceTabs) {
              try {
                await handleCreateTab(savedTab.profileId, savedTab.workspaceId)
              } catch (error) {
                console.error('Failed to restore tab:', error)
              }
            }

            // Set active workspace only if it still exists
            if (session.activeWorkspaceId && workspaceIds.has(session.activeWorkspaceId)) {
              setActiveWorkspace(session.activeWorkspaceId)
            } else if (validWorkspaceTabs[0].workspaceId) {
              setActiveWorkspace(validWorkspaceTabs[0].workspaceId)
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
      }

      // Create a default tab only if no tabs were restored
      // This ensures a terminal is always available on startup
      const currentTabs = useTerminalStore.getState().tabs
      if (currentTabs.length === 0) {
        try {
          await handleCreateTab(undefined, null) // null = force unassigned
        } catch (error) {
          console.error('Failed to create default tab:', error)
        }
      }
    }
    restoreSession()
  }, [isConfigLoaded, isWorkspacesLoaded, profiles.length, handleCreateTab, setActiveWorkspace])

  // Save session before window closes
  useEffect(() => {
    const saveSession = () => {
      // Only save tabs that belong to a workspace
      const sessionTabs = tabs
        .filter(tab => tab.workspaceId)
        .map(tab => ({
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
    }

    window.addEventListener('beforeunload', saveSession)
    return () => window.removeEventListener('beforeunload', saveSession)
  }, [tabs, activeTabId, activeWorkspaceId])

  return {
    isConfigLoaded,
    isWorkspacesLoaded
  }
}
