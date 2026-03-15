import { test, expect } from '@playwright/test'
import { launchApp, closeApp, waitForTerminal, settle, type AppContext } from './helpers/app'

let ctx: AppContext

test.beforeEach(async () => {
  ctx = await launchApp()
})

test.afterEach(async () => {
  await closeApp(ctx)
})

test.describe('Window Controls', () => {
  test('window title contains VoidTerm', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    const title = await page.title()
    // The window title is set via Electron, check the document title or window title
    // VoidTerm sets it as "TabName - VoidTerm"
    const windowTitle = await ctx.app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0]
      return win?.getTitle() || ''
    })
    expect(windowTitle).toContain('VoidTerm')
  })

  test('maximize and restore window', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Check initial state is not maximized
    const initialMaximized = await ctx.app.evaluate(({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows()[0]?.isMaximized() || false
    })

    // Maximize via the titlebar button
    const maximizeBtn = page.locator('.tabbar-controls button').nth(1) // minimize, maximize, close
    if (await maximizeBtn.isVisible()) {
      await maximizeBtn.click()
      await settle(page)

      const isMaximized = await ctx.app.evaluate(({ BrowserWindow }) => {
        return BrowserWindow.getAllWindows()[0]?.isMaximized() || false
      })
      expect(isMaximized).toBe(!initialMaximized)

      // Click again to restore
      await maximizeBtn.click()
      await settle(page)

      const isRestored = await ctx.app.evaluate(({ BrowserWindow }) => {
        return BrowserWindow.getAllWindows()[0]?.isMaximized() || false
      })
      expect(isRestored).toBe(initialMaximized)
    }
  })

  test('minimize window', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Click minimize button (first in titlebar controls)
    const minimizeBtn = page.locator('.tabbar-controls button').first()
    if (await minimizeBtn.isVisible()) {
      await minimizeBtn.click()
      await settle(page)

      const isMinimized = await ctx.app.evaluate(({ BrowserWindow }) => {
        return BrowserWindow.getAllWindows()[0]?.isMinimized() || false
      })
      expect(isMinimized).toBe(true)

      // Restore for cleanup
      await ctx.app.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0]?.restore()
      })
    }
  })
})
