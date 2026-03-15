import { test, expect } from '@playwright/test'
import { launchApp, closeApp, waitForTerminal, shortcut, getTabCount, settle, createTab, getProfileNames, type AppContext } from './helpers/app'

let ctx: AppContext

test.beforeEach(async () => {
  ctx = await launchApp()
})

test.afterEach(async () => {
  await closeApp(ctx)
})

test.describe('Terminal Lifecycle', () => {
  test('app starts with one terminal tab', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    const tabCount = await getTabCount(page)
    expect(tabCount).toBe(1)

    // Active tab should exist
    const activeTab = page.locator('.tab.active')
    await expect(activeTab).toBeVisible()

    // Terminal canvas should be rendered
    await expect(page.locator('.xterm-screen')).toBeVisible()
  })

  test('create new terminal via Ctrl+T (default profile)', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await createTab(page, 0)

    const tabCount = await getTabCount(page)
    expect(tabCount).toBe(2)
  })

  test('create terminal with each available profile', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Get available profile names
    const profiles = await getProfileNames(page)
    expect(profiles.length).toBeGreaterThan(0)

    // Create a tab for each profile
    for (let i = 0; i < profiles.length; i++) {
      await createTab(page, i)
      await settle(page, 500)

      const tabCount = await getTabCount(page)
      // 1 initial + (i+1) created
      expect(tabCount).toBe(i + 2)

      // Verify the new tab title matches the profile name
      const activeTabTitle = await page.locator('.tab.active .tab-title').textContent()
      expect(activeTabTitle).toBe(profiles[i])
    }
  })

  test('close tab via close button', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Create a second tab
    await createTab(page, 1) // use second profile (e.g. CMD)
    expect(await getTabCount(page)).toBe(2)

    // Close the active tab via X button
    const activeTab = page.locator('.tab.active')
    const closeBtn = activeTab.locator('.tab-close')
    await closeBtn.click()
    await settle(page)

    expect(await getTabCount(page)).toBe(1)
  })

  test('close last tab shows exit dialog', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    expect(await getTabCount(page)).toBe(1)

    // Try to close the last tab
    await shortcut(page, 'Control+w')
    await settle(page)

    // Exit dialog should appear
    const exitDialog = page.locator('.session-restore-dialog')
    await expect(exitDialog).toBeVisible()
    await expect(exitDialog.locator('h3')).toContainText('Close VoidTerm')

    // Cancel should dismiss the dialog
    await exitDialog.locator('button', { hasText: 'Cancel' }).click()
    await settle(page)
    await expect(exitDialog).not.toBeVisible()

    // Tab should still exist
    expect(await getTabCount(page)).toBe(1)
  })

  test('reopen closed tab with Ctrl+Shift+T', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Create a second tab with different profile
    await createTab(page, 1)
    expect(await getTabCount(page)).toBe(2)

    // Close the active tab
    const closeBtn = page.locator('.tab.active .tab-close')
    await closeBtn.click()
    await settle(page)
    expect(await getTabCount(page)).toBe(1)

    // Reopen with Ctrl+Shift+T
    await shortcut(page, 'Control+Shift+t')
    await settle(page)
    expect(await getTabCount(page)).toBe(2)
  })
})
