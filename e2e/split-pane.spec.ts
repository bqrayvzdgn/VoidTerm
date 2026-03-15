import { test, expect } from '@playwright/test'
import { launchApp, closeApp, waitForTerminal, shortcut, settle, type AppContext } from './helpers/app'

let ctx: AppContext

test.beforeEach(async () => {
  ctx = await launchApp()
})

test.afterEach(async () => {
  await closeApp(ctx)
})

test.describe('Split Pane', () => {
  test('vertical split creates two panels', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Initially 1 terminal wrapper
    const initialPanels = await page.locator('.terminal-wrapper').count()
    expect(initialPanels).toBe(1)

    // Split vertical
    await shortcut(page, 'Control+Shift+d')
    await settle(page)

    // Should now have 2 terminal wrappers
    const panels = await page.locator('.terminal-wrapper').count()
    expect(panels).toBe(2)

    // Split pane divider should exist
    await expect(page.locator('.split-pane-divider')).toBeVisible()
  })

  test('horizontal split creates two panels', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+Shift+e')
    await settle(page)

    const panels = await page.locator('.terminal-wrapper').count()
    expect(panels).toBe(2)
    await expect(page.locator('.split-pane-divider')).toBeVisible()
  })

  test('close pane with Ctrl+Shift+W', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Split first
    await shortcut(page, 'Control+Shift+d')
    await settle(page)
    expect(await page.locator('.terminal-wrapper').count()).toBe(2)

    // Close active pane
    await shortcut(page, 'Control+Shift+w')
    await settle(page)

    expect(await page.locator('.terminal-wrapper').count()).toBe(1)
    await expect(page.locator('.split-pane-divider')).not.toBeVisible()
  })

  test('pane navigation with Alt+Arrow', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Split vertical (left/right)
    await shortcut(page, 'Control+Shift+d')
    await settle(page)

    // Navigate to the other pane
    await shortcut(page, 'Alt+ArrowRight')
    await settle(page, 300)

    // Navigate back
    await shortcut(page, 'Alt+ArrowLeft')
    await settle(page, 300)

    // Both panes should still exist
    expect(await page.locator('.terminal-wrapper').count()).toBe(2)
  })

  test('layout picker applies 2x2 grid', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Click the split/layout button in tab bar
    const splitBtn = page.locator('.split-btn')
    await splitBtn.click()
    await settle(page)

    // Layout dropdown should appear
    const dropdown = page.locator('.layout-dropdown')
    await expect(dropdown).toBeVisible()

    // Select 2x2 layout
    const gridOption = dropdown.locator('.layout-dropdown-item').nth(3) // 2x2 is 4th option (Reset, 1x2, 2x1, 2x2)
    await gridOption.click()
    await settle(page, 1000)

    // Should have 4 terminal wrappers
    const panels = await page.locator('.terminal-wrapper').count()
    expect(panels).toBe(4)
  })

  test('layout picker reset to single pane', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // First split to have multiple panes
    await shortcut(page, 'Control+Shift+d')
    await settle(page)
    expect(await page.locator('.terminal-wrapper').count()).toBe(2)

    // Open layout picker and select Reset (1x1)
    await page.locator('.split-btn').click()
    await settle(page)
    const resetOption = page.locator('.layout-dropdown .layout-dropdown-item').first()
    await resetOption.click()
    await settle(page, 1000)

    expect(await page.locator('.terminal-wrapper').count()).toBe(1)
  })
})
