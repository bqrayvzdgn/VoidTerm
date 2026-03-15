import { test, expect } from '@playwright/test'
import { launchApp, closeApp, waitForTerminal, shortcut, settle, type AppContext } from './helpers/app'

let ctx: AppContext

test.beforeEach(async () => {
  ctx = await launchApp()
})

test.afterEach(async () => {
  await closeApp(ctx)
})

test.describe('Command Palette', () => {
  test('open with Ctrl+Shift+P', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+Shift+p')
    await settle(page)

    const palette = page.locator('.command-palette')
    await expect(palette).toBeVisible()

    // Input should be visible
    const input = palette.locator('.command-palette-input')
    await expect(input).toBeVisible()
  })

  test('close with Escape', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+Shift+p')
    await settle(page)
    await expect(page.locator('.command-palette')).toBeVisible()

    await shortcut(page, 'Escape')
    await settle(page)

    await expect(page.locator('.command-palette')).not.toBeVisible()
  })

  test('shows command list', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+Shift+p')
    await settle(page)

    const items = page.locator('.command-palette-item')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })

  test('filter commands by typing', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+Shift+p')
    await settle(page)

    const initialCount = await page.locator('.command-palette-item').count()

    // Type to filter
    const input = page.locator('.command-palette-input')
    await input.fill('split')
    await settle(page)

    const filteredCount = await page.locator('.command-palette-item').count()
    expect(filteredCount).toBeLessThan(initialCount)
    expect(filteredCount).toBeGreaterThan(0)
  })

  test('navigate with arrow keys and execute with Enter', async () => {
    const { page } = ctx
    await waitForTerminal(page)

    await shortcut(page, 'Control+Shift+p')
    await settle(page)

    // Press down arrow to select second item
    await page.keyboard.press('ArrowDown')
    await settle(page, 200)

    // Second item should be selected
    const selected = page.locator('.command-palette-item.selected')
    await expect(selected).toBeVisible()

    // Press Enter to execute (palette should close)
    await page.keyboard.press('Enter')
    await settle(page)

    await expect(page.locator('.command-palette')).not.toBeVisible()
  })
})
