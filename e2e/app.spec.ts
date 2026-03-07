import { test, expect, _electron as electron } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'

let app: ElectronApplication
let page: Page

test.beforeAll(async () => {
  app = await electron.launch({
    args: ['.'],
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  })
  page = await app.firstWindow()
  // Wait for app to fully load
  await page.waitForSelector('.app-container', { timeout: 15000 })
})

test.afterAll(async () => {
  await app.close()
})

test('app launches and shows main window', async () => {
  const title = await page.title()
  expect(title).toContain('VoidTerm')
  const appContainer = page.locator('.app-container')
  await expect(appContainer).toBeVisible()
})

test('tab bar is visible', async () => {
  const tabBar = page.locator('.tabbar')
  await expect(tabBar).toBeVisible()
})

test('new tab button exists', async () => {
  const newTabBtn = page.locator('.tab-new').first()
  await expect(newTabBtn).toBeVisible()
})

test('settings modal opens and closes', async () => {
  // Open settings via keyboard
  await page.keyboard.press('Control+,')
  const settingsModal = page.locator('.settings-modal').first()
  await expect(settingsModal).toBeVisible({ timeout: 5000 })

  // Close with Escape
  await page.keyboard.press('Escape')
  await expect(settingsModal).not.toBeVisible({ timeout: 5000 })
})

test('command palette opens and closes', async () => {
  await page.keyboard.press('Control+Shift+P')
  const palette = page.locator('.command-palette').first()
  await expect(palette).toBeVisible({ timeout: 5000 })

  await page.keyboard.press('Escape')
  await expect(palette).not.toBeVisible({ timeout: 5000 })
})
