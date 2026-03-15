import { useEffect } from 'react'
import { useSettingsStore, useIsConfigLoaded, useSettingsActions } from '../store/settingsStore'
import { useIsWorkspacesLoaded, useWorkspaceActions } from '../store/workspaceStore'
import { useToastStore } from '../store/toastStore'
import { createLogger } from '../utils/logger'

const logger = createLogger('SessionManager')

interface UseSessionManagerProps {
  handleCreateTab: (profileId?: string, workspaceId?: string | null) => Promise<void>
}

// Module-level flags to prevent double initialization in StrictMode
let isInitialized = false
let defaultTabCreated = false

// Reset flags on module reload (HMR)
const hot = (import.meta as { hot?: { dispose: (cb: () => void) => void } }).hot
if (hot) {
  hot.dispose(() => {
    isInitialized = false
    defaultTabCreated = false
  })
}

export const useSessionManager = ({ handleCreateTab }: UseSessionManagerProps) => {
  const { profiles } = useSettingsStore()

  const isConfigLoaded = useIsConfigLoaded()
  const isWorkspacesLoaded = useIsWorkspacesLoaded()
  const { loadFromConfig: loadSettingsConfig } = useSettingsActions()
  const { loadFromConfig: loadWorkspacesConfig } = useWorkspaceActions()

  // Load config on startup
  useEffect(() => {
    if (isInitialized) return
    isInitialized = true

    Promise.all([loadSettingsConfig(), loadWorkspacesConfig()]).catch((error) => {
      logger.error('Failed to load config:', error)
      useToastStore.getState().warning('Failed to load configuration. Using defaults.')
    })
  }, [loadSettingsConfig, loadWorkspacesConfig])

  // Create default tab after config is loaded
  useEffect(() => {
    if (!isConfigLoaded || !isWorkspacesLoaded || defaultTabCreated || profiles.length === 0) return
    defaultTabCreated = true

    const createDefault = async () => {
      try {
        await handleCreateTab(undefined, null)
      } catch (error) {
        logger.error('Failed to create default tab:', error)
      }
    }
    createDefault()
  }, [isConfigLoaded, isWorkspacesLoaded, profiles.length, handleCreateTab])

  return {
    isConfigLoaded,
    isWorkspacesLoaded
  }
}
