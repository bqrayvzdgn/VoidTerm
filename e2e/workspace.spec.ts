import { test, expect } from '@playwright/test'
import { launchApp, closeApp, waitForTerminal, shortcut, settle, type AppContext } from './helpers/app'

let ctx: AppContext

test.beforeEach(async () => {
  ctx = await launchApp()
})

test.afterEach(async () => {
  await closeApp(ctx)
})

test.describe('Workspace', () => {
  test('toggle sidebar with Ctrl+Shift+B', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Open sidebar
    await shortcut(page, 'Control+Shift+b')
    await settle(page)

    const sidebar = page.locator('.workspace-sidebar')
    await expect(sidebar).toBeVisible()

    // Close sidebar
    await shortcut(page, 'Control+Shift+b')
    await settle(page)

    // Sidebar returns null when collapsed — element should not be in DOM
    await expect(sidebar).not.toBeVisible()
  })

  test('create workspace via create dialog', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Open sidebar first
    await shortcut(page, 'Control+Shift+b')
    await settle(page)

    // Open create dialog
    await shortcut(page, 'Control+t')
    await settle(page, 300)

    const dialog = page.locator('.create-dialog')
    await expect(dialog).toBeVisible()

    // Click workspace option (must exist in step 1)
    const workspaceOption = dialog.locator('.create-dialog-option').filter({
      has: page.locator('.create-dialog-title', { hasText: 'Workspace' })
    })
    await expect(workspaceOption).toBeVisible()
    await workspaceOption.click()
    await settle(page)

    // Fill in workspace name
    const nameInput = dialog.locator('.create-dialog-input')
    await expect(nameInput).toBeVisible()
    await nameInput.fill('Test Workspace')
    await dialog.locator('.create-dialog-submit').click()
    await settle(page)

    // Workspace should appear in sidebar
    const sidebar = page.locator('.workspace-sidebar')
    await expect(sidebar.locator('text=Test Workspace').first()).toBeVisible()
  })

  test('sidebar shows workspace tree with terminals', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Open sidebar
    await shortcut(page, 'Control+Shift+b')
    await settle(page)

    const sidebar = page.locator('.workspace-sidebar')
    await expect(sidebar).toBeVisible()

    // Should have at least one terminal tree item
    const terminalItems = sidebar.locator('.terminal-tree-item')
    const count = await terminalItems.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('click terminal in sidebar activates it', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Open sidebar
    await shortcut(page, 'Control+Shift+b')
    await settle(page)

    // Click the first terminal item
    const terminalItem = page.locator('.terminal-tree-item').first()
    await terminalItem.click()
    await settle(page)

    // That terminal's tab should be active
    await expect(terminalItem).toHaveClass(/active/)
  })
})
