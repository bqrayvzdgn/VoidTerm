import { test, expect } from '@playwright/test'
import { launchApp, closeApp, waitForTerminal, shortcut, settle, type AppContext } from './helpers/app'

let ctx: AppContext

test.beforeEach(async () => {
  ctx = await launchApp()
})

test.afterEach(async () => {
  await closeApp(ctx)
})

test.describe('Search', () => {
  test('open search bar with Ctrl+F', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+f')
    await settle(page)

    const searchBar = page.locator('.terminal-search-bar')
    await expect(searchBar).toBeVisible()

    // Search input should be focused
    const searchInput = searchBar.locator('.terminal-search-input')
    await expect(searchInput).toBeVisible()
  })

  test('close search bar with Escape', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    // Open search
    await shortcut(page, 'Control+f')
    await settle(page)
    await expect(page.locator('.terminal-search-bar')).toBeVisible()

    // Close with Escape
    await shortcut(page, 'Escape')
    await settle(page)

    await expect(page.locator('.terminal-search-bar')).not.toBeVisible()
  })

  test('search input accepts text', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+f')
    await settle(page)

    const searchInput = page.locator('.terminal-search-input')
    await searchInput.fill('test')
    await settle(page)

    await expect(searchInput).toHaveValue('test')

    // Match count should be displayed
    const matchCount = page.locator('.terminal-search-count')
    await expect(matchCount).toBeVisible()
  })

  test('regex toggle exists and is clickable', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+f')
    await settle(page)

    // Find regex toggle button
    const toggles = page.locator('.terminal-search-toggle')
    const count = await toggles.count()
    expect(count).toBeGreaterThanOrEqual(1)

    // Click first toggle (regex)
    await toggles.first().click()
    await settle(page)

    // Should have active class
    await expect(toggles.first()).toHaveClass(/active/)

    // Click again to deactivate
    await toggles.first().click()
    await settle(page)
    await expect(toggles.first()).not.toHaveClass(/active/)
  })
})
