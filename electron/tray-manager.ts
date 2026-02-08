import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron'
import path from 'path'
import { createLogger } from './logger'

const logger = createLogger('TrayManager')

export class TrayManager {
  private tray: Tray | null = null
  private mainWindow: BrowserWindow | null = null
  private isQuitting = false

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow

    try {
      const iconPath = this.getIconPath()
      const icon = nativeImage.createFromPath(iconPath)
      this.tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
      this.tray.setToolTip('VoidTerm')
      this.updateContextMenu()

      this.tray.on('click', () => {
        this.toggleWindow()
      })

      app.on('before-quit', () => {
        this.isQuitting = true
      })

      logger.info('System tray initialized')
    } catch (error) {
      logger.error('Failed to create system tray:', error)
    }
  }

  private getIconPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'icon.png')
    }
    // Dev mode: use build assets
    const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
    return path.join(app.getAppPath(), 'build', iconName)
  }

  private updateContextMenu(): void {
    if (!this.tray) return

    const menu = Menu.buildFromTemplate([
      {
        label: 'New Terminal',
        click: () => {
          this.showWindow()
          this.mainWindow?.webContents.send('new-tab')
        }
      },
      { type: 'separator' },
      {
        label: 'Show/Hide Window',
        click: () => this.toggleWindow()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.isQuitting = true
          app.quit()
        }
      }
    ])

    this.tray.setContextMenu(menu)
  }

  private toggleWindow(): void {
    if (!this.mainWindow) return

    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide()
    } else {
      this.showWindow()
    }
  }

  private showWindow(): void {
    if (!this.mainWindow) return
    this.mainWindow.show()
    this.mainWindow.focus()
  }

  shouldPreventClose(): boolean {
    return !this.isQuitting && this.tray !== null
  }

  dispose(): void {
    this.tray?.destroy()
    this.tray = null
  }
}
