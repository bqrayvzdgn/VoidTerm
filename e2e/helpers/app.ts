import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import path from 'path'

export interface AppContext {
  app: ElectronApplication
  page: Page
}

const ROOT = path.resolve(__dirname, '../..')

/**
 * Build a clean environment for Electron.
 * ELECTRON_RUN_AS_NODE must be removed — if set, Electron runs as plain Node
 * and `require('electron').app` becomes undefined.
 */
function cleanEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (key === 'ELECTRON_RUN_AS_NODE') continue
    if (value !== undefined) env[key] = value
  }
  return env
}

/**
 * Launch the Electron app for testing.
 * Expects the app to be pre-built (npm run build:electron && npx vite build).
 */
export async function launchApp(): Promise<AppContext> {
  const mainPath = path.join(ROOT, 'dist', 'electron', 'main.js')

  const app = await electron.launch({
    args: [mainPath],
    cwd: ROOT,
    env: cleanEnv()
  })

  const page = await app.firstWindow()
  await page.waitForSelector('.app-container:not(.loading)', { timeout: 15_000 })
  return { app, page }
}

/**
 * Close the Electron app gracefully.
 */
export async function closeApp(ctx: AppContext | undefined): Promise<void> {
  if (ctx?.app) {
    await ctx.app.close()
  }
}

/**
 * Wait for a terminal to be ready (xterm canvas rendered).
 */
export async function waitForTerminal(page: Page): Promise<void> {
  await page.waitForSelector('.xterm-screen', { timeout: 10_000 })
}

/**
 * Press a keyboard shortcut.
 */
export async function shortcut(page: Page, keys: string): Promise<void> {
  await page.keyboard.press(keys)
}

/**
 * Get the count of visible tabs.
 */
export async function getTabCount(page: Page): Promise<number> {
  return page.locator('.tab[data-tab-id]').count()
}

/**
 * Wait a short time for UI to settle after an action.
 */
export async function settle(page: Page, ms = 500): Promise<void> {
  await page.waitForTimeout(ms)
}

/**
 * Create a new terminal tab via Create Dialog.
 * @param profileIndex - 0-based index of the profile to select (default: 0 = first profile)
 */
export async function createTab(page: Page, profileIndex = 0): Promise<void> {
  await shortcut(page, 'Control+t')
  await settle(page, 300)

  // Step 1: click "Terminal" by matching its title text
  const terminalBtn = page.locator('.create-dialog .create-dialog-option').filter({
    has: page.locator('.create-dialog-title', { hasText: 'Terminal' })
  })
  await terminalBtn.click()
  await settle(page, 300)

  // Step 2: select profile by index
  const profiles = page.locator('.create-dialog .create-dialog-option')
  const count = await profiles.count()
  const idx = Math.min(profileIndex, count - 1)
  await profiles.nth(idx).click()
  await settle(page)
}

/**
 * Get available profile names from the Create Dialog (step 2).
 * Opens and closes the dialog.
 */
export async function getProfileNames(page: Page): Promise<string[]> {
  await shortcut(page, 'Control+t')
  await settle(page, 300)

  // Step 1: click "Terminal" by matching its title text
  const termBtn = page.locator('.create-dialog .create-dialog-option').filter({
    has: page.locator('.create-dialog-title', { hasText: 'Terminal' })
  })
  await termBtn.click()
  await settle(page, 300)

  // Read profile names
  const profiles = page.locator('.create-dialog .create-dialog-option')
  const count = await profiles.count()
  const names: string[] = []
  for (let i = 0; i < count; i++) {
    const title = await profiles.nth(i).locator('.create-dialog-title').textContent()
    if (title) names.push(title)
  }

  // Close dialog with Escape
  await shortcut(page, 'Escape')
  await settle(page, 300)

  return names
}
