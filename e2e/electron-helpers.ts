import { _electron as electron, ElectronApplication, Page } from '@playwright/test'
import path from 'path'

export interface ElectronTestContext {
  electronApp: ElectronApplication
  mainWindow: Page
}

/**
 * Launch the Electron app for testing
 */
export async function launchElectronApp(): Promise<ElectronTestContext> {
  // Build electron before running tests
  const electronPath = require('electron') as string
  const appPath = path.join(__dirname, '..')

  const electronApp = await electron.launch({
    args: [appPath],
    executablePath: electronPath as unknown as string
  })

  // Wait for the main window to be ready
  const mainWindow = await electronApp.firstWindow()
  
  // Wait for the app to be fully loaded
  await mainWindow.waitForLoadState('domcontentloaded')
  await mainWindow.waitForSelector('.app-container', { timeout: 30000 })

  return { electronApp, mainWindow }
}

/**
 * Close the Electron app after testing
 */
export async function closeElectronApp(context: ElectronTestContext): Promise<void> {
  await context.electronApp.close()
}

/**
 * Get the terminal element from the main window
 */
export async function getTerminalElement(page: Page): Promise<ReturnType<Page['locator']>> {
  return page.locator('.xterm-screen')
}

/**
 * Type text into the active terminal
 */
export async function typeInTerminal(page: Page, text: string): Promise<void> {
  const terminal = await getTerminalElement(page)
  await terminal.click()
  await page.keyboard.type(text)
}

/**
 * Press a key combination in the terminal
 */
export async function pressKeys(page: Page, keys: string): Promise<void> {
  await page.keyboard.press(keys)
}

/**
 * Wait for terminal output to contain specific text
 */
export async function waitForTerminalOutput(
  page: Page,
  text: string,
  timeout = 10000
): Promise<void> {
  await page.waitForFunction(
    (searchText) => {
      const terminal = document.querySelector('.xterm-screen')
      return terminal?.textContent?.includes(searchText) ?? false
    },
    text,
    { timeout }
  )
}

/**
 * Get all tab elements
 */
export async function getTabs(page: Page): Promise<ReturnType<Page['locator']>> {
  return page.locator('.tab-item')
}

/**
 * Click on a tab by index
 */
export async function clickTab(page: Page, index: number): Promise<void> {
  const tabs = await getTabs(page)
  await tabs.nth(index).click()
}

/**
 * Get the count of open tabs
 */
export async function getTabCount(page: Page): Promise<number> {
  const tabs = await getTabs(page)
  return tabs.count()
}

/**
 * Open a new tab using keyboard shortcut
 */
export async function openNewTab(page: Page): Promise<void> {
  await pressKeys(page, 'Control+t')
  // Wait for new tab to appear
  await page.waitForTimeout(500)
}

/**
 * Close current tab using keyboard shortcut
 */
export async function closeCurrentTab(page: Page): Promise<void> {
  await pressKeys(page, 'Control+w')
  await page.waitForTimeout(300)
}

/**
 * Open settings panel
 */
export async function openSettings(page: Page): Promise<void> {
  await pressKeys(page, 'Control+,')
  await page.waitForSelector('.settings-modal', { timeout: 5000 })
}

/**
 * Close settings panel
 */
export async function closeSettings(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await page.waitForSelector('.settings-modal', { state: 'detached', timeout: 5000 })
}

/**
 * Split terminal vertically
 */
export async function splitVertical(page: Page): Promise<void> {
  await pressKeys(page, 'Control+Shift+d')
  await page.waitForTimeout(500)
}

/**
 * Split terminal horizontally
 */
export async function splitHorizontal(page: Page): Promise<void> {
  await pressKeys(page, 'Control+Shift+e')
  await page.waitForTimeout(500)
}

/**
 * Open command palette
 */
export async function openCommandPalette(page: Page): Promise<void> {
  await pressKeys(page, 'Control+Shift+p')
  await page.waitForSelector('.command-palette', { timeout: 5000 })
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `e2e/screenshots/${name}.png`,
    fullPage: true
  })
}
