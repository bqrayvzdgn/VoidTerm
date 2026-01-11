import { useEffect, useRef } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import { useSettingsStore, useIsConfigLoaded, useSettingsActions } from '../store/settingsStore'
import { useWorkspaceStore, useIsWorkspacesLoaded, useWorkspaceActions } from '../store/workspaceStore'

interface UseSessionManagerProps {
  handleCreateTab: (profileId?: string, workspaceId?: string) => Promise<void>
}

export const useSessionManager = ({ handleCreateTab }: UseSessionManagerProps) => {
  const { tabs, activeTabId } = useTerminalStore()
  const { profiles } = useSettingsStore()
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()
  
  const isConfigLoaded = useIsConfigLoaded()
  const isWorkspacesLoaded = useIsWorkspacesLoaded()
  const { loadFromConfig: loadSettingsConfig } = useSettingsActions()
  const { loadFromConfig: loadWorkspacesConfig } = useWorkspaceActions()

  const isInitialized = useRef(false)
  const sessionRestored = useRef(false)

  // Load config on startup
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    Promise.all([
      loadSettingsConfig(),
      loadWorkspacesConfig()
    ])
  }, [loadSettingsConfig, loadWorkspacesConfig])

  // Restore session after config is loaded
  useEffect(() => {
    if (!isConfigLoaded || sessionRestored.current || profiles.length === 0) return
    sessionRestored.current = true

    const restoreSession = async () => {
      let tabCreated = false

      try {
        const session = await window.electronAPI.config.getSession()
        if (session) {
          // Restore active workspace first
          if (session.activeWorkspaceId) {
            setActiveWorkspace(session.activeWorkspaceId)
          }

          // Only restore tabs that belong to a workspace
          if (session.tabs.length > 0) {
            const workspaceTabs = session.tabs.filter(tab => tab.workspaceId)
            for (const savedTab of workspaceTabs) {
              try {
                await handleCreateTab(savedTab.profileId, savedTab.workspaceId)
                tabCreated = true
              } catch (error) {
                console.error('Failed to restore tab:', error)
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
      }

      // If no workspace tabs, create a default unassigned tab
      if (!tabCreated) {
        try {
          await handleCreateTab()
        } catch (error) {
          console.error('Failed to create default tab:', error)
        }
      }
    }
    restoreSession()
  }, [isConfigLoaded, profiles.length, handleCreateTab, setActiveWorkspace])

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
