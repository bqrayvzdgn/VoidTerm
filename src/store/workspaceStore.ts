import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { v4 as uuidv4 } from 'uuid'
import type { Workspace } from '../types'
import { WORKSPACE_COLORS, WORKSPACE_ICONS } from '../constants'

interface WorkspaceStore {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  isLoaded: boolean

  // Actions
  loadFromConfig: () => Promise<void>
  addWorkspace: (name?: string) => Promise<string>
  removeWorkspace: (id: string) => Promise<void>
  setActiveWorkspace: (id: string | null) => void
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>
  getActiveWorkspace: () => Workspace | undefined
}

export const useWorkspaceStore = create<WorkspaceStore>()((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  isLoaded: false,

  loadFromConfig: async () => {
    try {
      const workspaces = await window.electronAPI.config.getWorkspaces()
      console.log('[WorkspaceStore] Loaded workspaces:', workspaces)
      set({
        workspaces,
        isLoaded: true
      })
    } catch (error) {
      console.error('Failed to load workspaces:', error)
      set({ isLoaded: true })
    }
  },

  addWorkspace: async (name?: string) => {
    const id = uuidv4()
    const workspaceCount = get().workspaces.length
    const workspace: Workspace = {
      id,
      name: name || `Workspace ${workspaceCount + 1}`,
      icon: WORKSPACE_ICONS[workspaceCount % WORKSPACE_ICONS.length],
      color: WORKSPACE_COLORS[workspaceCount % WORKSPACE_COLORS.length],
      isActive: true
    }

    try {
      const workspaces = await window.electronAPI.config.addWorkspace(workspace)
      set({
        workspaces: workspaces.map(w => ({ ...w, isActive: w.id === id })),
        activeWorkspaceId: id
      })
    } catch (error) {
      console.error('Failed to add workspace:', error)
    }

    return id
  },

  removeWorkspace: async (id) => {
    try {
      const workspaces = await window.electronAPI.config.removeWorkspace(id)
      const state = get()

      let newActiveId = state.activeWorkspaceId
      if (state.activeWorkspaceId === id) {
        newActiveId = workspaces[0]?.id || null
      }

      set({
        workspaces: workspaces.map((w, i) =>
          i === 0 && newActiveId === w.id ? { ...w, isActive: true } : { ...w, isActive: false }
        ),
        activeWorkspaceId: newActiveId
      })
    } catch (error) {
      console.error('Failed to remove workspace:', error)
    }
  },

  setActiveWorkspace: (id) => {
    set((state) => ({
      workspaces: state.workspaces.map(w => ({
        ...w,
        isActive: id ? w.id === id : false
      })),
      activeWorkspaceId: id
    }))
  },

  updateWorkspace: async (id, updates) => {
    try {
      const workspaces = await window.electronAPI.config.updateWorkspace(id, updates)
      set({ workspaces })
    } catch (error) {
      console.error('Failed to update workspace:', error)
    }
  },

  getActiveWorkspace: () => {
    const state = get()
    return state.workspaces.find(w => w.id === state.activeWorkspaceId)
  }
}))

// Selectors for performance optimization
export const useWorkspaces = () => useWorkspaceStore(useShallow((state) => state.workspaces))
export const useActiveWorkspaceId = () => useWorkspaceStore((state) => state.activeWorkspaceId)
export const useIsWorkspacesLoaded = () => useWorkspaceStore((state) => state.isLoaded)
export const useWorkspaceActions = () => useWorkspaceStore(useShallow((state) => ({
  loadFromConfig: state.loadFromConfig,
  addWorkspace: state.addWorkspace,
  removeWorkspace: state.removeWorkspace,
  setActiveWorkspace: state.setActiveWorkspace,
  updateWorkspace: state.updateWorkspace,
  getActiveWorkspace: state.getActiveWorkspace
})))
