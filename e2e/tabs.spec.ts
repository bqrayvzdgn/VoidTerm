import { test, expect } from '@playwright/test'
import { launchApp, closeApp, waitForTerminal, shortcut, getTabCount, settle, createTab, type AppContext } from './helpers/app'

let ctx: AppContext

test.beforeEach(async () => {
  ctx = await launchApp()
})

test.afterEach(async () => {
  await closeApp(ctx)
})

/** Helper to create N additional tabs with different profiles */
async function createTabs(count: number) {
  for (let i = 0; i < count; i++) {
    await createTab(ctx.page, i) // rotate through profiles
  }
}

test.describe('Tab Management', () => {
  test('navigate tabs with click', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Create 2 more tabs (total 3)
    await createTabs(2)
    expect(await getTabCount(page)).toBe(3)

    // Get all tab elements
    const tabs = page.locator('.tab[data-tab-id]')
    const firstTabId = await tabs.nth(0).getAttribute('data-tab-id')
    const thirdTabId = await tabs.nth(2).getAttribute('data-tab-id')

    // Last created tab should be active
    const activeId = await page.locator('.tab.active').getAttribute('data-tab-id')
    expect(activeId).toBe(thirdTabId)

    // Click the first tab
    await tabs.nth(0).click()
    await settle(page, 300)
    const newActiveId = await page.locator('.tab.active').getAttribute('data-tab-id')
    expect(newActiveId).toBe(firstTabId)

    // Click the last tab
    await tabs.nth(2).click()
    await settle(page, 300)
    const finalActiveId = await page.locator('.tab.active').getAttribute('data-tab-id')
    expect(finalActiveId).toBe(thirdTabId)
  })

  test('click tab to activate', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await createTabs(1)
    expect(await getTabCount(page)).toBe(2)

    // Click the first tab
    const firstTab = page.locator('.tab[data-tab-id]').first()
    await firstTab.click()
    await settle(page)

    await expect(firstTab).toHaveClass(/active/)
  })

  test('tab context menu shows pin and color options', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Right-click the active tab
    const activeTab = page.locator('.tab.active')
    await activeTab.click({ button: 'right' })
    await settle(page)

    // Context menu should be visible
    const contextMenu = page.locator('.context-menu')
    await expect(contextMenu).toBeVisible()

    // Should have Pin option
    await expect(contextMenu.locator('text=Pin')).toBeVisible()
  })

  test.skip('pin tab via context menu', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Right-click the active tab
    const activeTab = page.locator('.tab.active')
    await activeTab.click({ button: 'right' })
    await settle(page)

    const contextMenu = page.locator('.context-menu')
    await expect(contextMenu).toBeVisible()

    // Click "Pin Tab" button in context menu
    const pinBtn = contextMenu.locator('button.context-menu-item', { hasText: 'Pin Tab' })
    await expect(pinBtn).toBeVisible()
    await pinBtn.click()
    await settle(page, 500)

    // Context menu should close after clicking
    await expect(contextMenu).not.toBeVisible()

    // The tab should now have pinned class
    const tabClass = await page.locator('.tab.active').getAttribute('class') || ''
    expect(tabClass).toContain('pinned')
  })

  test('tab displays profile title', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    const tabTitle = page.locator('.tab.active .tab-title')
    const title = await tabTitle.textContent()
    expect(title).toBeTruthy()
    expect(title!.length).toBeGreaterThan(0)
  })
})
