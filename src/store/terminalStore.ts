import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { v4 as uuidv4 } from 'uuid'
import type { Tab, Pane, TerminalState } from '../types'

interface TerminalStore {
  tabs: Tab[]
  activeTabId: string | null
  terminals: Map<string, TerminalState>
  panes: Map<string, Pane>

  // Tab actions
  addTab: (profileId?: string, title?: string, workspaceId?: string) => string
  removeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabTitle: (tabId: string, title: string) => void
  updateTab: (tabId: string, updates: Partial<Tab>) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void

  // Terminal actions
  addTerminal: (tabId: string, profileId: string, ptyId: string) => string
  removeTerminal: (terminalId: string) => void
  updateTerminalTitle: (terminalId: string, title: string) => void

  // Pane actions
  setPane: (tabId: string, pane: Pane) => void
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  terminals: new Map(),
  panes: new Map(),

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
    const tabs = state.tabs.filter(t => t.id !== tabId)

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
  }
}))

// Helper function for removeTab - also exported from utils/pane.ts
function collectTerminalIds(pane: Pane): string[] {
  if (pane.type === 'terminal' && pane.terminalId) {
    return [pane.terminalId]
  }
  if (pane.children) {
    return pane.children.flatMap(collectTerminalIds)
  }
  return []
}

// Selectors for performance optimization
export const useTerminalTabs = () => useTerminalStore(useShallow((state) => state.tabs))
export const useActiveTabId = () => useTerminalStore((state) => state.activeTabId)
export const useTerminalPanes = () => useTerminalStore(useShallow((state) => state.panes))
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
  setPane: state.setPane
})))
