import { describe, it, expect, beforeEach } from 'vitest'
import { useTerminalStore } from './terminalStore'

// Helper to reset store between tests
const resetStore = () => {
  useTerminalStore.setState({
    tabs: [],
    activeTabId: null,
    terminals: new Map(),
    panes: new Map(),
    broadcastMode: false,
    closedTabs: [],
    tabGroups: []
  })
}

describe('terminalStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('Tab Management', () => {
    describe('addTab', () => {
      it('should add a new tab with default values', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()

        const state = useTerminalStore.getState()
        expect(state.tabs).toHaveLength(1)
        expect(state.tabs[0].profileId).toBe('default')
        expect(state.tabs[0].title).toBe('Terminal')
        expect(state.tabs[0].isActive).toBe(true)
        expect(state.activeTabId).toBe(tabId)
      })

      it('should add a tab with custom profile and title', () => {
        const store = useTerminalStore.getState()
        store.addTab('custom-profile', 'My Terminal')

        const state = useTerminalStore.getState()
        expect(state.tabs[0].profileId).toBe('custom-profile')
        expect(state.tabs[0].title).toBe('My Terminal')
      })

      it('should add a tab with workspace id', () => {
        const store = useTerminalStore.getState()
        store.addTab('default', 'Terminal', 'workspace-1')

        const state = useTerminalStore.getState()
        expect(state.tabs[0].workspaceId).toBe('workspace-1')
      })

      it('should set new tab as active and deactivate others', () => {
        const store = useTerminalStore.getState()
        const tabId1 = store.addTab()
        const tabId2 = store.addTab()

        const state = useTerminalStore.getState()
        expect(state.tabs.find(t => t.id === tabId1)?.isActive).toBe(false)
        expect(state.tabs.find(t => t.id === tabId2)?.isActive).toBe(true)
        expect(state.activeTabId).toBe(tabId2)
      })
    })

    describe('removeTab', () => {
      it('should remove a tab', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()
        store.removeTab(tabId)

        const state = useTerminalStore.getState()
        expect(state.tabs).toHaveLength(0)
        expect(state.activeTabId).toBeNull()
      })

      it('should save closed tab info', () => {
        const store = useTerminalStore.getState()
        store.addTab('my-profile', 'Closed Tab', 'workspace-1')
        const tabId = useTerminalStore.getState().tabs[0].id
        store.removeTab(tabId)

        const state = useTerminalStore.getState()
        expect(state.closedTabs).toHaveLength(1)
        expect(state.closedTabs[0].profileId).toBe('my-profile')
        expect(state.closedTabs[0].title).toBe('Closed Tab')
        expect(state.closedTabs[0].workspaceId).toBe('workspace-1')
      })

      it('should limit closed tabs to MAX_CLOSED_TABS (10)', () => {
        const store = useTerminalStore.getState()
        
        // Add and remove 12 tabs
        for (let i = 0; i < 12; i++) {
          store.addTab('default', `Tab ${i}`)
          const tabId = useTerminalStore.getState().tabs[0].id
          store.removeTab(tabId)
        }

        const state = useTerminalStore.getState()
        expect(state.closedTabs).toHaveLength(10)
      })

      it('should set previous tab as active when removing active tab', () => {
        const store = useTerminalStore.getState()
        store.addTab(undefined, 'Tab 1')
        const tabId2 = store.addTab(undefined, 'Tab 2')
        const tabId3 = store.addTab(undefined, 'Tab 3')

        // tabId3 is active, remove it
        store.removeTab(tabId3)

        const state = useTerminalStore.getState()
        expect(state.activeTabId).toBe(tabId2)
      })

      it('should clean up terminals and panes when removing tab', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()
        store.addTerminal(tabId, 'default', 'pty-1')

        const stateBeforeRemove = useTerminalStore.getState()
        expect(stateBeforeRemove.terminals.size).toBe(1)
        expect(stateBeforeRemove.panes.size).toBe(1)

        store.removeTab(tabId)

        const stateAfterRemove = useTerminalStore.getState()
        expect(stateAfterRemove.terminals.size).toBe(0)
        expect(stateAfterRemove.panes.size).toBe(0)
      })
    })

    describe('setActiveTab', () => {
      it('should set the active tab', () => {
        const store = useTerminalStore.getState()
        const tabId1 = store.addTab()
        const tabId2 = store.addTab()

        store.setActiveTab(tabId1)

        const state = useTerminalStore.getState()
        expect(state.activeTabId).toBe(tabId1)
        expect(state.tabs.find(t => t.id === tabId1)?.isActive).toBe(true)
        expect(state.tabs.find(t => t.id === tabId2)?.isActive).toBe(false)
      })
    })

    describe('updateTabTitle', () => {
      it('should update tab title', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()
        store.updateTabTitle(tabId, 'New Title')

        const state = useTerminalStore.getState()
        expect(state.tabs[0].title).toBe('New Title')
      })
    })

    describe('updateTab', () => {
      it('should update tab with partial updates', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()
        store.updateTab(tabId, { title: 'Updated', profileId: 'new-profile' })

        const state = useTerminalStore.getState()
        expect(state.tabs[0].title).toBe('Updated')
        expect(state.tabs[0].profileId).toBe('new-profile')
      })
    })

    describe('reorderTabs', () => {
      it('should reorder tabs', () => {
        const store = useTerminalStore.getState()
        store.addTab(undefined, 'Tab 1')
        store.addTab(undefined, 'Tab 2')
        store.addTab(undefined, 'Tab 3')

        store.reorderTabs(0, 2)

        const state = useTerminalStore.getState()
        expect(state.tabs[0].title).toBe('Tab 2')
        expect(state.tabs[1].title).toBe('Tab 3')
        expect(state.tabs[2].title).toBe('Tab 1')
      })

      it('should reorder tabs from end to beginning', () => {
        const store = useTerminalStore.getState()
        store.addTab(undefined, 'Tab 1')
        store.addTab(undefined, 'Tab 2')
        store.addTab(undefined, 'Tab 3')

        store.reorderTabs(2, 0)

        const state = useTerminalStore.getState()
        expect(state.tabs[0].title).toBe('Tab 3')
        expect(state.tabs[1].title).toBe('Tab 1')
        expect(state.tabs[2].title).toBe('Tab 2')
      })
    })

    describe('popClosedTab', () => {
      it('should return and remove the most recent closed tab', () => {
        const store = useTerminalStore.getState()
        store.addTab('profile-1', 'Tab 1')
        store.addTab('profile-2', 'Tab 2')
        
        const tab1Id = useTerminalStore.getState().tabs[0].id
        const tab2Id = useTerminalStore.getState().tabs[1].id
        
        store.removeTab(tab1Id)
        store.removeTab(tab2Id)

        const closedTab = store.popClosedTab()

        expect(closedTab?.profileId).toBe('profile-2')
        expect(closedTab?.title).toBe('Tab 2')

        const state = useTerminalStore.getState()
        expect(state.closedTabs).toHaveLength(1)
      })

      it('should return undefined when no closed tabs', () => {
        const store = useTerminalStore.getState()
        const result = store.popClosedTab()
        expect(result).toBeUndefined()
      })
    })
  })

  describe('Terminal Management', () => {
    describe('addTerminal', () => {
      it('should add a terminal and create a pane', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()
        const terminalId = store.addTerminal(tabId, 'my-profile', 'pty-123')

        const state = useTerminalStore.getState()
        expect(state.terminals.size).toBe(1)
        
        const terminal = state.terminals.get(terminalId)
        expect(terminal?.ptyId).toBe('pty-123')
        expect(terminal?.profileId).toBe('my-profile')
        expect(terminal?.title).toBe('Terminal')

        const pane = state.panes.get(tabId)
        expect(pane?.type).toBe('terminal')
        expect(pane?.terminalId).toBe(terminalId)
      })
    })

    describe('removeTerminal', () => {
      it('should remove a terminal', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()
        const terminalId = store.addTerminal(tabId, 'default', 'pty-1')

        store.removeTerminal(terminalId)

        const state = useTerminalStore.getState()
        expect(state.terminals.size).toBe(0)
      })
    })

    describe('updateTerminalTitle', () => {
      it('should update terminal title', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()
        const terminalId = store.addTerminal(tabId, 'default', 'pty-1')

        store.updateTerminalTitle(terminalId, 'New Terminal Title')

        const state = useTerminalStore.getState()
        expect(state.terminals.get(terminalId)?.title).toBe('New Terminal Title')
      })

      it('should do nothing for non-existent terminal', () => {
        const store = useTerminalStore.getState()
        store.updateTerminalTitle('non-existent', 'Title')

        const state = useTerminalStore.getState()
        expect(state.terminals.size).toBe(0)
      })
    })
  })

  describe('Pane Management', () => {
    describe('setPane', () => {
      it('should set a pane for a tab', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()

        store.setPane(tabId, {
          id: 'pane-1',
          type: 'split',
          direction: 'horizontal',
          children: [
            { id: 'pane-2', type: 'terminal', terminalId: 'term-1' },
            { id: 'pane-3', type: 'terminal', terminalId: 'term-2' }
          ]
        })

        const state = useTerminalStore.getState()
        const pane = state.panes.get(tabId)
        expect(pane?.type).toBe('split')
        expect(pane?.direction).toBe('horizontal')
        expect(pane?.children).toHaveLength(2)
      })

      it('should overwrite existing pane', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()

        store.setPane(tabId, { id: 'pane-1', type: 'terminal', terminalId: 'term-1' })
        store.setPane(tabId, { id: 'pane-2', type: 'terminal', terminalId: 'term-2' })

        const state = useTerminalStore.getState()
        const pane = state.panes.get(tabId)
        expect(pane?.id).toBe('pane-2')
        expect(pane?.terminalId).toBe('term-2')
      })
    })
  })

  describe('Broadcast Mode', () => {
    describe('toggleBroadcastMode', () => {
      it('should toggle broadcast mode on', () => {
        const store = useTerminalStore.getState()
        store.toggleBroadcastMode()

        const state = useTerminalStore.getState()
        expect(state.broadcastMode).toBe(true)
      })

      it('should toggle broadcast mode off', () => {
        const store = useTerminalStore.getState()
        store.toggleBroadcastMode()
        store.toggleBroadcastMode()

        const state = useTerminalStore.getState()
        expect(state.broadcastMode).toBe(false)
      })
    })
  })

  describe('Tab Groups', () => {
    describe('createTabGroup', () => {
      it('should create a tab group with default name', () => {
        const store = useTerminalStore.getState()
        store.createTabGroup()

        const state = useTerminalStore.getState()
        expect(state.tabGroups).toHaveLength(1)
        expect(state.tabGroups[0].name).toBe('Group 1')
        expect(state.tabGroups[0].isCollapsed).toBe(false)
      })

      it('should create a tab group with custom name', () => {
        const store = useTerminalStore.getState()
        store.createTabGroup('My Group')

        const state = useTerminalStore.getState()
        expect(state.tabGroups[0].name).toBe('My Group')
      })

      it('should assign tabs to group on creation', () => {
        const store = useTerminalStore.getState()
        const tabId1 = store.addTab()
        const tabId2 = store.addTab()

        const groupId = store.createTabGroup('Group', [tabId1, tabId2])

        const state = useTerminalStore.getState()
        expect(state.tabs.find(t => t.id === tabId1)?.groupId).toBe(groupId)
        expect(state.tabs.find(t => t.id === tabId2)?.groupId).toBe(groupId)
      })

      it('should cycle through colors for new groups', () => {
        const store = useTerminalStore.getState()
        store.createTabGroup('Group 1')
        store.createTabGroup('Group 2')

        const state = useTerminalStore.getState()
        expect(state.tabGroups[0].color).not.toBe(state.tabGroups[1].color)
      })
    })

    describe('removeTabGroup', () => {
      it('should remove a tab group and unassign tabs', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()
        const createdGroupId = store.createTabGroup('Group', [tabId])

        store.removeTabGroup(createdGroupId)

        const state = useTerminalStore.getState()
        expect(state.tabGroups).toHaveLength(0)
        expect(state.tabs.find(t => t.id === tabId)?.groupId).toBeUndefined()
      })
    })

    describe('updateTabGroup', () => {
      it('should update tab group properties', () => {
        const store = useTerminalStore.getState()
        const groupId = store.createTabGroup('Old Name')

        store.updateTabGroup(groupId, { name: 'New Name', color: '#ff0000' })

        const state = useTerminalStore.getState()
        expect(state.tabGroups[0].name).toBe('New Name')
        expect(state.tabGroups[0].color).toBe('#ff0000')
      })
    })

    describe('addTabToGroup', () => {
      it('should add a tab to a group', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()
        const groupId = store.createTabGroup('Group')

        store.addTabToGroup(tabId, groupId)

        const state = useTerminalStore.getState()
        expect(state.tabs.find(t => t.id === tabId)?.groupId).toBe(groupId)
      })
    })

    describe('removeTabFromGroup', () => {
      it('should remove a tab from its group', () => {
        const store = useTerminalStore.getState()
        const tabId = store.addTab()
        store.createTabGroup('Group', [tabId])

        store.removeTabFromGroup(tabId)

        const state = useTerminalStore.getState()
        expect(state.tabs.find(t => t.id === tabId)?.groupId).toBeUndefined()
      })
    })

    describe('toggleGroupCollapse', () => {
      it('should toggle group collapse state', () => {
        const store = useTerminalStore.getState()
        const groupId = store.createTabGroup('Group')

        store.toggleGroupCollapse(groupId)

        let state = useTerminalStore.getState()
        expect(state.tabGroups[0].isCollapsed).toBe(true)

        store.toggleGroupCollapse(groupId)

        state = useTerminalStore.getState()
        expect(state.tabGroups[0].isCollapsed).toBe(false)
      })
    })
  })
})
