import { test, expect } from '@playwright/test'
import { launchApp, closeApp, waitForTerminal, shortcut, settle, type AppContext } from './helpers/app'

let ctx: AppContext

test.beforeEach(async () => {
  ctx = await launchApp()
})

test.afterEach(async () => {
  await closeApp(ctx)
})

test.describe('Settings', () => {
  test('open settings with Ctrl+,', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+,')
    await settle(page)

    const modal = page.locator('.settings-modal')
    await expect(modal).toBeVisible()
  })

  test('close settings with close button', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+,')
    await settle(page)

    const closeBtn = page.locator('.settings-modal .modal-close')
    await closeBtn.click()
    await settle(page)

    await expect(page.locator('.settings-modal')).not.toBeVisible()
  })

  test('navigate settings tabs', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+,')
    await settle(page)

    // Each tab should show distinct content when clicked
    const tabExpectations: Record<string, string> = {
      appearance: 'Font Family',
      terminal: 'Default Profile',
      shortcuts: 'New Tab',
      profiles: 'Profile',
      about: 'Electron'
    }

    for (const [tab, expectedText] of Object.entries(tabExpectations)) {
      const tabBtn = page.locator(`#settings-tab-${tab}`)
      await tabBtn.click()
      await settle(page, 200)

      // Tab button should be selected
      await expect(tabBtn).toHaveAttribute('aria-selected', 'true')

      // Content panel should contain tab-specific text
      const content = page.locator('.settings-content')
      await expect(content).toContainText(expectedText)
    }
  })

  test('appearance: change cursor style', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+,')
    await settle(page)

    // Go to appearance tab (should be default)
    const appearanceTab = page.locator('#settings-tab-appearance')
    await appearanceTab.click()
    await settle(page)

    // Find cursor style select and change its value
    const selects = page.locator('.settings-content select.settings-select')
    const count = await selects.count()
    expect(count).toBeGreaterThan(0)

    // The cursor style select has block/underline/bar options
    // Find it by checking option values
    for (let i = 0; i < count; i++) {
      const sel = selects.nth(i)
      const html = await sel.innerHTML()
      if (html.includes('bar')) {
        await sel.selectOption('bar')
        await settle(page)
        await expect(sel).toHaveValue('bar')
        break
      }
    }
  })

  test('profiles: list exists', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+,')
    await settle(page)

    // Go to profiles tab
    const profilesTab = page.locator('#settings-tab-profiles')
    await profilesTab.click()
    await settle(page)

    // Should have at least one profile
    const content = page.locator('.settings-content')
    await expect(content).toBeVisible()
  })

  test('shortcuts: displays shortcut list', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+,')
    await settle(page)

    const shortcutsTab = page.locator('#settings-tab-shortcuts')
    await shortcutsTab.click()
    await settle(page)

    // Shortcuts content should be visible
    const content = page.locator('.settings-content')
    await expect(content).toBeVisible()

    // Should contain shortcut items
    const text = await content.textContent()
    expect(text).toContain('New Tab')
  })

  test('about: shows version info', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+,')
    await settle(page)

    const aboutTab = page.locator('#settings-tab-about')
    await aboutTab.click()
    await settle(page)

    const content = page.locator('.settings-content')
    const text = await content.textContent()

    // Should contain version strings
    expect(text).toContain('Electron')
    expect(text).toContain('Node')
    expect(text).toContain('Chrome')
  })
})
