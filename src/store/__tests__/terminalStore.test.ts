import { describe, it, expect, beforeEach } from 'vitest'
import { useTerminalStore } from '../terminalStore'

function resetStore() {
  useTerminalStore.setState({
    tabs: [],
    activeTabId: null,
    terminals: new Map(),
    panes: new Map(),
    closedTabs: [],
    tabActivity: new Map(),
    terminalCwds: new Map()
  })
}

describe('terminalStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('addTab', () => {
    it('creates a tab and sets it as active', () => {
      const tabId = useTerminalStore.getState().addTab('default', 'Test Tab')
      const state = useTerminalStore.getState()
      expect(state.tabs).toHaveLength(1)
      expect(state.tabs[0].id).toBe(tabId)
      expect(state.tabs[0].title).toBe('Test Tab')
      expect(state.tabs[0].profileId).toBe('default')
      expect(state.tabs[0].isActive).toBe(true)
      expect(state.activeTabId).toBe(tabId)
    })

    it('deactivates previous tabs when adding new one', () => {
      const tab1 = useTerminalStore.getState().addTab()
      useTerminalStore.getState().addTab()
      const state = useTerminalStore.getState()
      expect(state.tabs.find((t) => t.id === tab1)!.isActive).toBe(false)
      expect(state.tabs).toHaveLength(2)
    })

    it('uses default profileId and title', () => {
      useTerminalStore.getState().addTab()
      const tab = useTerminalStore.getState().tabs[0]
      expect(tab.profileId).toBe('default')
      expect(tab.title).toBe('Terminal')
    })

    it('stores workspaceId when provided', () => {
      useTerminalStore.getState().addTab('default', 'Tab', 'ws-1')
      expect(useTerminalStore.getState().tabs[0].workspaceId).toBe('ws-1')
    })
  })

  describe('removeTab', () => {
    it('removes a tab', () => {
      const tabId = useTerminalStore.getState().addTab()
      useTerminalStore.getState().removeTab(tabId)
      expect(useTerminalStore.getState().tabs).toHaveLength(0)
    })

    it('updates active tab to previous when active is removed', () => {
      const tab1 = useTerminalStore.getState().addTab()
      const tab2 = useTerminalStore.getState().addTab()
      useTerminalStore.getState().removeTab(tab2)
      expect(useTerminalStore.getState().activeTabId).toBe(tab1)
    })

    it('sets activeTabId to null when last tab removed', () => {
      const tabId = useTerminalStore.getState().addTab()
      useTerminalStore.getState().removeTab(tabId)
      expect(useTerminalStore.getState().activeTabId).toBeNull()
    })
  })

  describe('setActiveTab', () => {
    it('sets the active tab', () => {
      const tab1 = useTerminalStore.getState().addTab()
      useTerminalStore.getState().addTab()
      useTerminalStore.getState().setActiveTab(tab1)
      const state = useTerminalStore.getState()
      expect(state.activeTabId).toBe(tab1)
      expect(state.tabs.find((t) => t.id === tab1)!.isActive).toBe(true)
    })
  })

  describe('closedTabs', () => {
    it('popClosedTab returns last closed tab', () => {
      const tabId = useTerminalStore.getState().addTab('profile-1', 'My Tab')
      useTerminalStore.getState().removeTab(tabId)
      const closed = useTerminalStore.getState().popClosedTab()
      expect(closed).toBeDefined()
      expect(closed!.profileId).toBe('profile-1')
      expect(closed!.title).toBe('My Tab')
    })

    it('popClosedTab returns undefined when no closed tabs', () => {
      expect(useTerminalStore.getState().popClosedTab()).toBeUndefined()
    })

    it('limits closed tabs to MAX_CLOSED_TABS (10)', () => {
      for (let i = 0; i < 15; i++) {
        const tabId = useTerminalStore.getState().addTab('default', `Tab ${i}`)
        useTerminalStore.getState().removeTab(tabId)
      }
      expect(useTerminalStore.getState().closedTabs.length).toBeLessThanOrEqual(10)
    })
  })

  describe('addTerminal / removeTerminal', () => {
    it('adds a terminal with state', () => {
      const tabId = useTerminalStore.getState().addTab()
      const terminalId = useTerminalStore.getState().addTerminal(tabId, 'default', 'pty-1')
      const state = useTerminalStore.getState()
      expect(state.terminals.has(terminalId)).toBe(true)
      expect(state.terminals.get(terminalId)!.ptyId).toBe('pty-1')
      expect(state.panes.has(tabId)).toBe(true)
    })

    it('removes a terminal', () => {
      const tabId = useTerminalStore.getState().addTab()
      const terminalId = useTerminalStore.getState().addTerminal(tabId, 'default', 'pty-1')
      useTerminalStore.getState().removeTerminal(terminalId)
      expect(useTerminalStore.getState().terminals.has(terminalId)).toBe(false)
    })
  })

  describe('updateTabTitle', () => {
    it('updates the title of a tab', () => {
      const tabId = useTerminalStore.getState().addTab()
      useTerminalStore.getState().updateTabTitle(tabId, 'New Title')
      expect(useTerminalStore.getState().tabs[0].title).toBe('New Title')
    })
  })

  describe('reorderTabs', () => {
    it('reorders tabs', () => {
      useTerminalStore.getState().addTab('default', 'Tab A')
      useTerminalStore.getState().addTab('default', 'Tab B')
      useTerminalStore.getState().addTab('default', 'Tab C')
      useTerminalStore.getState().reorderTabs(0, 2)
      const titles = useTerminalStore.getState().tabs.map((t) => t.title)
      expect(titles).toEqual(['Tab B', 'Tab C', 'Tab A'])
    })
  })
})
