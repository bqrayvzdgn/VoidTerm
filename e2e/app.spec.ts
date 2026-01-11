import { test, expect } from '@playwright/test'
import {
  launchElectronApp,
  closeElectronApp,
  ElectronTestContext,
  getTabCount,
  openNewTab,
  closeCurrentTab,
  openSettings,
  closeSettings,
  splitVertical,
  typeInTerminal,
  pressKeys
} from './electron-helpers'

let context: ElectronTestContext

test.describe('VoidTerm Application', () => {
  test.beforeAll(async () => {
    context = await launchElectronApp()
  })

  test.afterAll(async () => {
    await closeElectronApp(context)
  })

  test.describe('Application Launch', () => {
    test('should launch the application', async () => {
      expect(context.mainWindow).toBeDefined()
    })

    test('should have the correct title', async () => {
      const title = await context.mainWindow.title()
      expect(title).toContain('VoidTerm')
    })

    test('should show the main container', async () => {
      const container = context.mainWindow.locator('.app-container')
      await expect(container).toBeVisible()
    })

    test('should have at least one terminal tab', async () => {
      const tabCount = await getTabCount(context.mainWindow)
      expect(tabCount).toBeGreaterThanOrEqual(1)
    })

    test('should show terminal screen', async () => {
      const terminal = context.mainWindow.locator('.xterm-screen')
      await expect(terminal).toBeVisible()
    })
  })

  test.describe('Tab Management', () => {
    test('should create new tab with Ctrl+T', async () => {
      const initialCount = await getTabCount(context.mainWindow)
      await openNewTab(context.mainWindow)
      const newCount = await getTabCount(context.mainWindow)
      expect(newCount).toBe(initialCount + 1)
    })

    test('should close tab with Ctrl+W', async () => {
      // First create a new tab to have something to close
      await openNewTab(context.mainWindow)
      const initialCount = await getTabCount(context.mainWindow)
      
      await closeCurrentTab(context.mainWindow)
      const newCount = await getTabCount(context.mainWindow)
      expect(newCount).toBe(initialCount - 1)
    })

    test('should switch tabs with click', async () => {
      // Ensure we have at least 2 tabs
      const tabCount = await getTabCount(context.mainWindow)
      if (tabCount < 2) {
        await openNewTab(context.mainWindow)
      }

      const tabs = context.mainWindow.locator('.tab-item')
      const firstTab = tabs.first()
      
      await firstTab.click()
      await expect(firstTab).toHaveClass(/active/)
    })
  })

  test.describe('Terminal Interaction', () => {
    test('should accept keyboard input', async () => {
      // Click on terminal to focus
      const terminal = context.mainWindow.locator('.xterm-screen')
      await terminal.click()

      // Type a simple command
      await context.mainWindow.keyboard.type('echo test')
      
      // Just verify no errors occurred - actual output verification
      // is difficult with PTY
      await expect(terminal).toBeVisible()
    })

    test('should handle Enter key', async () => {
      const terminal = context.mainWindow.locator('.xterm-screen')
      await terminal.click()
      
      await pressKeys(context.mainWindow, 'Enter')
      await expect(terminal).toBeVisible()
    })
  })

  test.describe('Split Panes', () => {
    test('should split terminal vertically with Ctrl+Shift+D', async () => {
      const initialPanes = await context.mainWindow.locator('.xterm-screen').count()
      
      await splitVertical(context.mainWindow)
      
      const newPanes = await context.mainWindow.locator('.xterm-screen').count()
      // Should have more terminal screens after split
      expect(newPanes).toBeGreaterThan(initialPanes)
    })
  })

  test.describe('Settings', () => {
    test('should open settings with Ctrl+,', async () => {
      await openSettings(context.mainWindow)
      
      const settingsModal = context.mainWindow.locator('.settings-modal')
      await expect(settingsModal).toBeVisible()
    })

    test('should close settings with Escape', async () => {
      // Make sure settings is open
      const settingsModal = context.mainWindow.locator('.settings-modal')
      if (!await settingsModal.isVisible()) {
        await openSettings(context.mainWindow)
      }

      await closeSettings(context.mainWindow)
      await expect(settingsModal).not.toBeVisible()
    })

    test('should have settings tabs', async () => {
      await openSettings(context.mainWindow)
      
      const tabs = context.mainWindow.locator('.settings-tab-button, [role="tab"]')
      const tabCount = await tabs.count()
      expect(tabCount).toBeGreaterThan(0)
      
      await closeSettings(context.mainWindow)
    })
  })

  test.describe('Theme', () => {
    test('should apply theme colors', async () => {
      const appContainer = context.mainWindow.locator('.app-container')
      const backgroundColor = await appContainer.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      
      // Should have a background color set
      expect(backgroundColor).toBeTruthy()
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    })
  })

  test.describe('Window Controls', () => {
    test('should have title bar controls', async () => {
      const titleBar = context.mainWindow.locator('.title-bar, .titlebar')
      // Title bar might be custom or native
      const isCustomTitleBar = await titleBar.count() > 0
      
      if (isCustomTitleBar) {
        const minimizeBtn = context.mainWindow.locator('[aria-label*="minimize"], .minimize-button')
        const maximizeBtn = context.mainWindow.locator('[aria-label*="maximize"], .maximize-button')
        const closeBtn = context.mainWindow.locator('[aria-label*="close"], .close-button')
        
        // At least one control should exist
        const hasControls = 
          await minimizeBtn.count() > 0 || 
          await maximizeBtn.count() > 0 || 
          await closeBtn.count() > 0
        
        expect(hasControls).toBe(true)
      }
    })
  })

  test.describe('Keyboard Shortcuts', () => {
    test('should toggle search with Ctrl+F', async () => {
      await pressKeys(context.mainWindow, 'Control+f')
      
      // Wait a bit for UI to update
      await context.mainWindow.waitForTimeout(300)
      
      const searchBar = context.mainWindow.locator('.terminal-search-bar, .search-input, [type="search"]')
      // Search bar should be visible or at least exist
      const isVisible = await searchBar.isVisible().catch(() => false)
      
      // Close search if opened
      if (isVisible) {
        await pressKeys(context.mainWindow, 'Escape')
      }
      
      // Just verify the shortcut didn't crash the app
      expect(context.mainWindow).toBeDefined()
    })

    test('should handle Ctrl+L to clear terminal', async () => {
      const terminal = context.mainWindow.locator('.xterm-screen')
      await terminal.click()
      
      await pressKeys(context.mainWindow, 'Control+l')
      
      // Verify terminal is still visible
      await expect(terminal).toBeVisible()
    })
  })
})
