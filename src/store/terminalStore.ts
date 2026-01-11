import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { v4 as uuidv4 } from 'uuid'
import type { Tab, Pane, TerminalState, TabGroup } from '../types'
import { collectTerminalIds } from '../utils/pane'

// Varsayılan grup renkleri
const GROUP_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
]

// Closed tab info for reopening
interface ClosedTab {
  profileId: string
  title: string
  workspaceId?: string
  closedAt: number
}

interface TerminalStore {
  tabs: Tab[]
  activeTabId: string | null
  terminals: Map<string, TerminalState>
  panes: Map<string, Pane>
  broadcastMode: boolean
  closedTabs: ClosedTab[]
  tabGroups: TabGroup[]

  // Tab actions
  addTab: (profileId?: string, title?: string, workspaceId?: string) => string
  removeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabTitle: (tabId: string, title: string) => void
  updateTab: (tabId: string, updates: Partial<Tab>) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  popClosedTab: () => ClosedTab | undefined

  // Terminal actions
  addTerminal: (tabId: string, profileId: string, ptyId: string) => string
  removeTerminal: (terminalId: string) => void
  updateTerminalTitle: (terminalId: string, title: string) => void

  // Pane actions
  setPane: (tabId: string, pane: Pane) => void

  // Broadcast actions
  toggleBroadcastMode: () => void

  // Tab Group actions
  createTabGroup: (name?: string, tabIds?: string[]) => string
  removeTabGroup: (groupId: string) => void
  updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => void
  addTabToGroup: (tabId: string, groupId: string) => void
  removeTabFromGroup: (tabId: string) => void
  toggleGroupCollapse: (groupId: string) => void
}

const MAX_CLOSED_TABS = 10 // Keep last 10 closed tabs

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  terminals: new Map(),
  panes: new Map(),
  broadcastMode: false,
  closedTabs: [],
  tabGroups: [],

  addTab: (profileId = 'default', title?: string, workspaceId?: string) => {
    const tabId = uuidv4()
    const tab: Tab = {
      id: tabId,
      title: title || 'Terminal',
      profileId,
      isActive: true,
      workspaceId
    }

    set((state) => ({
      tabs: [...state.tabs.map(t => ({ ...t, isActive: false })), tab],
      activeTabId: tabId
    }))

    return tabId
  },

  removeTab: (tabId) => {
    const state = get()
    const tabToClose = state.tabs.find(t => t.id === tabId)
    const tabs = state.tabs.filter(t => t.id !== tabId)

    // Save closed tab info for reopening later
    if (tabToClose) {
      const closedTabs = [
        { 
          profileId: tabToClose.profileId, 
          title: tabToClose.title, 
          workspaceId: tabToClose.workspaceId,
          closedAt: Date.now()
        },
        ...state.closedTabs
      ].slice(0, MAX_CLOSED_TABS)
      set({ closedTabs })
    }

    // Clean up terminals for this tab
    const pane = state.panes.get(tabId)
    if (pane) {
      const terminalIds = collectTerminalIds(pane)
      const terminals = new Map(state.terminals)
      terminalIds.forEach(id => terminals.delete(id))

      const panes = new Map(state.panes)
      panes.delete(tabId)

      set({ terminals, panes })
    }

    // Set new active tab
    let newActiveTabId = state.activeTabId
    if (state.activeTabId === tabId) {
      const index = state.tabs.findIndex(t => t.id === tabId)
      newActiveTabId = tabs[Math.max(0, index - 1)]?.id || null
    }

    set({
      tabs: tabs.map(t => ({ ...t, isActive: t.id === newActiveTabId })),
      activeTabId: newActiveTabId
    })
  },

  setActiveTab: (tabId) => {
    set((state) => ({
      tabs: state.tabs.map(t => ({ ...t, isActive: t.id === tabId })),
      activeTabId: tabId
    }))
  },

  updateTabTitle: (tabId, title) => {
    set((state) => ({
      tabs: state.tabs.map(t => t.id === tabId ? { ...t, title } : t)
    }))
  },

  updateTab: (tabId, updates) => {
    set((state) => ({
      tabs: state.tabs.map(t => t.id === tabId ? { ...t, ...updates } : t)
    }))
  },

  reorderTabs: (fromIndex, toIndex) => {
    set((state) => {
      const newTabs = [...state.tabs]
      const [movedTab] = newTabs.splice(fromIndex, 1)
      newTabs.splice(toIndex, 0, movedTab)
      return { tabs: newTabs }
    })
  },

  addTerminal: (tabId, profileId, ptyId) => {
    const terminalId = uuidv4()
    const terminal: TerminalState = {
      id: terminalId,
      ptyId,
      profileId,
      title: 'Terminal'
    }

    set((state) => {
      const terminals = new Map(state.terminals)
      terminals.set(terminalId, terminal)

      const panes = new Map(state.panes)
      panes.set(tabId, {
        id: uuidv4(),
        type: 'terminal',
        terminalId
      })

      return { terminals, panes }
    })

    return terminalId
  },

  removeTerminal: (terminalId) => {
    set((state) => {
      const terminals = new Map(state.terminals)
      terminals.delete(terminalId)
      return { terminals }
    })
  },

  updateTerminalTitle: (terminalId, title) => {
    set((state) => {
      const terminals = new Map(state.terminals)
      const terminal = terminals.get(terminalId)
      if (terminal) {
        terminals.set(terminalId, { ...terminal, title })
      }
      return { terminals }
    })
  },

  setPane: (tabId, pane) => {
    set((state) => {
      const panes = new Map(state.panes)
      panes.set(tabId, pane)
      return { panes }
    })
  },

  toggleBroadcastMode: () => {
    set((state) => ({ broadcastMode: !state.broadcastMode }))
  },

  popClosedTab: () => {
    const state = get()
    if (state.closedTabs.length === 0) return undefined
    
    const [closedTab, ...rest] = state.closedTabs
    set({ closedTabs: rest })
    return closedTab
  },

  // Tab Group Actions
  createTabGroup: (name?: string, tabIds?: string[]) => {
    const groupId = uuidv4()
    const state = get()
    const colorIndex = state.tabGroups.length % GROUP_COLORS.length
    
    const group: TabGroup = {
      id: groupId,
      name: name || `Group ${state.tabGroups.length + 1}`,
      color: GROUP_COLORS[colorIndex],
      isCollapsed: false
    }

    set((s) => ({
      tabGroups: [...s.tabGroups, group],
      tabs: s.tabs.map(t => 
        tabIds?.includes(t.id) ? { ...t, groupId } : t
      )
    }))

    return groupId
  },

  removeTabGroup: (groupId: string) => {
    set((state) => ({
      tabGroups: state.tabGroups.filter(g => g.id !== groupId),
      tabs: state.tabs.map(t => 
        t.groupId === groupId ? { ...t, groupId: undefined } : t
      )
    }))
  },

  updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => {
    set((state) => ({
      tabGroups: state.tabGroups.map(g => 
        g.id === groupId ? { ...g, ...updates } : g
      )
    }))
  },

  addTabToGroup: (tabId: string, groupId: string) => {
    set((state) => ({
      tabs: state.tabs.map(t => 
        t.id === tabId ? { ...t, groupId } : t
      )
    }))
  },

  removeTabFromGroup: (tabId: string) => {
    set((state) => ({
      tabs: state.tabs.map(t => 
        t.id === tabId ? { ...t, groupId: undefined } : t
      )
    }))
  },

  toggleGroupCollapse: (groupId: string) => {
    set((state) => ({
      tabGroups: state.tabGroups.map(g => 
        g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
      )
    }))
  }
}))

// Selectors for performance optimization
export const useTerminalTabs = () => useTerminalStore(useShallow((state) => state.tabs))
export const useActiveTabId = () => useTerminalStore((state) => state.activeTabId)
export const useTerminalPanes = () => useTerminalStore(useShallow((state) => state.panes))
export const useBroadcastMode = () => useTerminalStore((state) => state.broadcastMode)
export const useClosedTabs = () => useTerminalStore(useShallow((state) => state.closedTabs))
export const useTabGroups = () => useTerminalStore(useShallow((state) => state.tabGroups))
export const useTerminalActions = () => useTerminalStore(useShallow((state) => ({
  addTab: state.addTab,
  removeTab: state.removeTab,
  setActiveTab: state.setActiveTab,
  updateTabTitle: state.updateTabTitle,
  updateTab: state.updateTab,
  reorderTabs: state.reorderTabs,
  addTerminal: state.addTerminal,
  removeTerminal: state.removeTerminal,
  updateTerminalTitle: state.updateTerminalTitle,
  setPane: state.setPane,
  toggleBroadcastMode: state.toggleBroadcastMode,
  popClosedTab: state.popClosedTab,
  createTabGroup: state.createTabGroup,
  removeTabGroup: state.removeTabGroup,
  updateTabGroup: state.updateTabGroup,
  addTabToGroup: state.addTabToGroup,
  removeTabFromGroup: state.removeTabFromGroup,
  toggleGroupCollapse: state.toggleGroupCollapse
})))
