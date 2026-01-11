import { autoUpdater } from 'electron-updater'
import { BrowserWindow, ipcMain, dialog } from 'electron'
import log from 'electron-log'

// Configure logging
autoUpdater.logger = log
log.transports.file.level = 'info'

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

  constructor() {
    // Disable auto-download to let user decide
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    this.setupEventListeners()
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  private setupEventListeners(): void {
    // When checking for updates
    autoUpdater.on('checking-for-update', () => {
      this.sendToRenderer('update-checking')
      log.info('Checking for updates...')
    })

    // When an update is available
    autoUpdater.on('update-available', (info) => {
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
    autoUpdater.on('update-not-available', (info) => {
      this.isUpdateAvailable = false
      this.sendToRenderer('update-not-available', { version: info.version })
      log.info('No updates available')
    })

    // Download progress
    autoUpdater.on('download-progress', (progress) => {
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
    autoUpdater.on('update-downloaded', (info) => {
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
    autoUpdater.on('error', (error) => {
      this.sendToRenderer('update-error', { message: error.message })
      log.error('Update error:', error)
    })
  }

  setupIpcHandlers(): void {
    // Check for updates manually
    ipcMain.handle('check-for-updates', async () => {
      try {
        const result = await autoUpdater.checkForUpdates()
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
        await autoUpdater.downloadUpdate()
        return true
      } catch (error) {
        log.error('Failed to download update:', error)
        throw error
      }
    })

    // Install update and restart
    ipcMain.handle('install-update', () => {
      autoUpdater.quitAndInstall(false, true)
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
      await autoUpdater.checkForUpdates()
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
      autoUpdater.quitAndInstall(false, true)
    }
  }
}

// Singleton instance
export const updater = new AutoUpdater()
