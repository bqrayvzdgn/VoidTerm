import { BrowserWindow, ipcMain, dialog } from 'electron'
import log from 'electron-log'

// electron-updater accesses app.getVersion() on import,
// so we must lazy-load it after app is ready.
function getAutoUpdater() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { autoUpdater } = require('electron-updater')
  return autoUpdater
}

export interface UpdateInfo {
  version: string
  releaseNotes?: string
  releaseDate?: string
}

export interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

export class AutoUpdater {
  private mainWindow: BrowserWindow | null = null
  private isUpdateAvailable = false
  private updateInfo: UpdateInfo | null = null
  private initialized = false

  // Defer all autoUpdater access until init() is called (after app is ready)
  init(): void {
    if (this.initialized) return
    this.initialized = true

    const au = getAutoUpdater()
    // Configure logging
    au.logger = log
    // Disable auto-download to let user decide
    au.autoDownload = false
    au.autoInstallOnAppQuit = true

    this.setupEventListeners()
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  private setupEventListeners(): void {
    const au = getAutoUpdater()

    // When checking for updates
    au.on('checking-for-update', () => {
      this.sendToRenderer('update-checking')
      log.info('Checking for updates...')
    })

    // When an update is available
    au.on('update-available', (info: { version: string; releaseNotes?: string | unknown; releaseDate?: string }) => {
      this.isUpdateAvailable = true
      this.updateInfo = {
        version: info.version,
        releaseNotes: typeof info.releaseNotes === 'string'
          ? info.releaseNotes
          : undefined,
        releaseDate: info.releaseDate
      }
      this.sendToRenderer('update-available', this.updateInfo)
      log.info(`Update available: ${info.version}`)
    })

    // When no update is available
    au.on('update-not-available', (info: { version: string }) => {
      this.isUpdateAvailable = false
      this.sendToRenderer('update-not-available', { version: info.version })
      log.info('No updates available')
    })

    // Download progress
    au.on('download-progress', (progress: { bytesPerSecond: number; percent: number; transferred: number; total: number }) => {
      const progressInfo: UpdateProgress = {
        bytesPerSecond: progress.bytesPerSecond,
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total
      }
      this.sendToRenderer('update-download-progress', progressInfo)
      log.info(`Download progress: ${progress.percent.toFixed(2)}%`)
    })

    // When update is downloaded
    au.on('update-downloaded', (info: { version: string; releaseNotes?: string | unknown }) => {
      this.sendToRenderer('update-downloaded', {
        version: info.version,
        releaseNotes: typeof info.releaseNotes === 'string'
          ? info.releaseNotes
          : undefined
      })
      log.info(`Update downloaded: ${info.version}`)

      // Show notification to user
      this.showUpdateReadyDialog()
    })

    // Error handling
    au.on('error', (error: Error) => {
      this.sendToRenderer('update-error', { message: error.message })
      log.error('Update error:', error)
    })
  }

  setupIpcHandlers(): void {
    // Check for updates manually
    ipcMain.handle('check-for-updates', async () => {
      try {
        await getAutoUpdater().checkForUpdates()
        return {
          updateAvailable: this.isUpdateAvailable,
          updateInfo: this.updateInfo
        }
      } catch (error) {
        log.error('Failed to check for updates:', error)
        throw error
      }
    })

    // Download update
    ipcMain.handle('download-update', async () => {
      try {
        await getAutoUpdater().downloadUpdate()
        return true
      } catch (error) {
        log.error('Failed to download update:', error)
        throw error
      }
    })

    // Install update and restart
    ipcMain.handle('install-update', () => {
      getAutoUpdater().quitAndInstall(false, true)
    })

    // Get current update status
    ipcMain.handle('get-update-status', () => {
      return {
        isUpdateAvailable: this.isUpdateAvailable,
        updateInfo: this.updateInfo
      }
    })
  }

  async checkForUpdates(): Promise<void> {
    try {
      await getAutoUpdater().checkForUpdates()
    } catch (error) {
      log.error('Failed to check for updates:', error)
    }
  }

  private sendToRenderer(channel: string, data?: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }

  private async showUpdateReadyDialog(): Promise<void> {
    if (!this.mainWindow) return

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${this.updateInfo?.version} is ready to install`,
      detail: 'The update will be installed when you restart the application.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    })

    if (result.response === 0) {
      getAutoUpdater().quitAndInstall(false, true)
    }
  }
}

// Singleton instance (safe: constructor no longer accesses autoUpdater)
export const updater = new AutoUpdater()
