import { app, BrowserWindow, ipcMain, Menu, shell, session } from 'electron'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { PtyManager } from './pty-manager'
import { configManager, Profile, Settings, Workspace, BackupInfo } from './config-manager'
import { updater } from './auto-updater'
import { createLogger } from './logger'
import { isAllowed, RATE_LIMITS } from './rate-limiter'

const logger = createLogger('Main')

let mainWindow: BrowserWindow | null = null
let ptyManager: PtyManager

let _isDev: boolean | null = null
function isDev(): boolean {
  if (_isDev === null) _isDev = !app.isPackaged
  return _isDev
}

function createWindow() {
  // Platform-specific window options
  const isWindows = process.platform === 'win32'
  const isMac = process.platform === 'darwin'

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(app.getAppPath(), 'assets', 'icons', isWindows ? 'icon.ico' : 'icon.png')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    icon: iconPath,
    frame: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    transparent: false,
    backgroundColor: '#1e1e2e',
    ...(isWindows && { backgroundMaterial: 'mica' }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev()
            ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws://localhost:*"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
        ]
      }
    })
  })

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Capture Ctrl+Tab before Chromium handles it
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.key === 'Tab') {
      event.preventDefault()
      if (input.shift) {
        mainWindow?.webContents.send('prev-tab')
      } else {
        mainWindow?.webContents.send('next-tab')
      }
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Cleanup PTY processes when renderer crashes or is destroyed
  mainWindow.webContents.on('render-process-gone', (_, details) => {
    logger.warn(`Renderer process gone: ${details.reason}`)
    if (ptyManager) {
      ptyManager.cleanupOrphaned()
    }
  })

  mainWindow.webContents.on('crashed', () => {
    logger.warn('Renderer crashed, cleaning up PTY processes')
    if (ptyManager) {
      ptyManager.cleanupOrphaned()
    }
  })

  mainWindow.webContents.on('destroyed', () => {
    logger.info('WebContents destroyed, cleaning up PTY processes')
    if (ptyManager) {
      ptyManager.cleanupOrphaned()
    }
  })

  // Send maximize state changes to renderer
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximized', false)
  })

  // Custom title bar controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window-close', () => mainWindow?.close())

  // Window appearance controls
  ipcMain.on('set-opacity', (_, opacity: number) => {
    if (mainWindow) {
      mainWindow.setOpacity(Math.max(0.5, Math.min(1, opacity)))
    }
  })

  ipcMain.on('set-background-blur', (_, enabled: boolean) => {
    if (mainWindow) {
      if (process.platform === 'win32') {
        try {
          mainWindow.setBackgroundMaterial(enabled ? 'acrylic' : 'none')
        } catch {
          mainWindow.setBackgroundColor(enabled ? '#00000000' : '#0c0c0c')
        }
      } else if (process.platform === 'darwin') {
        mainWindow.setVibrancy(enabled ? 'under-window' : null)
      }
    }
  })

  // External links — validate protocol before opening
  ipcMain.on('open-external', (_, url: string) => {
    try {
      const parsed = new URL(url)
      if (['https:', 'http:', 'mailto:'].includes(parsed.protocol)) {
        shell.openExternal(url)
      } else {
        logger.warn(`Blocked opening URL with disallowed protocol: ${parsed.protocol}`)
      }
    } catch {
      logger.warn(`Blocked opening invalid URL: ${url}`)
    }
  })

  // System info (moved from preload for sandbox compatibility)
  ipcMain.handle('get-homedir', () => os.homedir())
  ipcMain.handle('path-join', (_, args: string[]) => {
    for (const segment of args) {
      if (typeof segment !== 'string') throw new Error('Invalid path segment: not a string')
      const normalized = path.normalize(segment)
      if (normalized.includes('..')) {
        throw new Error('Path traversal not allowed')
      }
    }
    return path.join(...args)
  })
  ipcMain.handle('shell-exists', (_, shellPath: string) => {
    try {
      fs.accessSync(shellPath, fs.constants.F_OK)
      return true
    } catch {
      return false
    }
  })

  // Set window title
  ipcMain.on('set-window-title', (_, title: string) => {
    if (mainWindow) {
      mainWindow.setTitle(title)
    }
  })

  // Terminal context menu
  ipcMain.on('show-terminal-context-menu', (_, options: { hasSelection: boolean; x: number; y: number }) => {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+Shift+C',
        enabled: options.hasSelection,
        click: () => mainWindow?.webContents.send('terminal-copy')
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+Shift+V',
        click: () => mainWindow?.webContents.send('terminal-paste')
      },
      { type: 'separator' },
      {
        label: 'Clear Terminal',
        click: () => mainWindow?.webContents.send('terminal-clear')
      },
      { type: 'separator' },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+Shift+A',
        click: () => mainWindow?.webContents.send('terminal-select-all')
      },
      { type: 'separator' },
      {
        label: 'Search',
        accelerator: 'CmdOrCtrl+F',
        click: () => mainWindow?.webContents.send('terminal-search')
      },
      { type: 'separator' },
      {
        label: 'Split Right',
        click: () => mainWindow?.webContents.send('split-vertical')
      },
      {
        label: 'Split Down',
        click: () => mainWindow?.webContents.send('split-horizontal')
      },
      { type: 'separator' },
      {
        label: 'Reset Terminal',
        click: () => mainWindow?.webContents.send('terminal-reset')
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: mainWindow!, x: options.x, y: options.y })
  })
}

function setupPtyHandlers() {
  ptyManager = new PtyManager()

  ipcMain.handle('pty-create', async (_, options: { shell?: string; cwd?: string; env?: Record<string, string> }) => {
    if (!isAllowed('pty-create', RATE_LIMITS.ptyCreate)) {
      logger.warn('pty-create rate limited')
      throw new Error('Rate limit exceeded for pty-create')
    }
    const id = ptyManager.create(options)
    return id
  })

  ipcMain.on('pty-write', (_, { id, data }: { id: string; data: string }) => {
    if (!isAllowed('pty-write', RATE_LIMITS.ptyWrite)) return
    ptyManager.write(id, data)
  })

  ipcMain.on('pty-resize', (_, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
    if (!isAllowed('pty-resize', RATE_LIMITS.ptyResize)) return
    ptyManager.resize(id, cols, rows)
  })

  ipcMain.on('pty-kill', (_, id: string) => {
    if (!isAllowed('pty-kill', RATE_LIMITS.ptyCreate)) return
    ptyManager.kill(id)
  })

  ipcMain.handle('pty-get-count', () => {
    return ptyManager.getCount()
  })

  ipcMain.handle('pty-get-active-ids', () => {
    return ptyManager.getActiveIds()
  })

  ptyManager.onData((id, data) => {
    mainWindow?.webContents.send('pty-data', { id, data })
  })

  ptyManager.onExit((id, exitCode) => {
    mainWindow?.webContents.send('pty-exit', { id, exitCode })
  })
}

function setupConfigHandlers() {
  ipcMain.handle('config-get', () => {
    return configManager.getConfig()
  })

  ipcMain.handle('config-get-path', () => {
    return configManager.getConfigPath()
  })

  // Settings
  ipcMain.handle('config-get-settings', () => {
    return configManager.getSettings()
  })

  ipcMain.handle('config-update-settings', (_, updates: Partial<Settings>) => {
    if (!isAllowed('config', RATE_LIMITS.config)) {
      logger.warn('config-update-settings rate limited')
      throw new Error('Rate limit exceeded for config-update-settings')
    }
    return configManager.updateSettings(updates)
  })

  ipcMain.handle('config-reset-settings', () => {
    return configManager.resetSettings()
  })

  // Profiles
  ipcMain.handle('config-get-profiles', () => {
    return configManager.getProfiles()
  })

  ipcMain.handle('config-add-profile', (_, profile: Profile) => {
    return configManager.addProfile(profile)
  })

  ipcMain.handle('config-update-profile', (_, { id, updates }: { id: string; updates: Partial<Profile> }) => {
    return configManager.updateProfile(id, updates)
  })

  ipcMain.handle('config-remove-profile', (_, id: string) => {
    return configManager.removeProfile(id)
  })

  // Workspaces
  ipcMain.handle('config-get-workspaces', () => {
    return configManager.getWorkspaces()
  })

  ipcMain.handle('config-add-workspace', (_, workspace: Workspace) => {
    return configManager.addWorkspace(workspace)
  })

  ipcMain.handle('config-update-workspace', (_, { id, updates }: { id: string; updates: Partial<Workspace> }) => {
    return configManager.updateWorkspace(id, updates)
  })

  ipcMain.handle('config-remove-workspace', (_, id: string) => {
    return configManager.removeWorkspace(id)
  })

  // Import/Export
  ipcMain.handle('config-export', () => {
    return configManager.exportConfig()
  })

  ipcMain.handle('config-import', (_, jsonString: string) => {
    if (!isAllowed('config', RATE_LIMITS.config)) {
      logger.warn('config-import rate limited')
      throw new Error('Rate limit exceeded for config-import')
    }
    return configManager.importConfig(jsonString)
  })

  ipcMain.handle('config-reset', () => {
    if (!isAllowed('config', RATE_LIMITS.config)) {
      logger.warn('config-reset rate limited')
      throw new Error('Rate limit exceeded for config-reset')
    }
    return configManager.resetConfig()
  })

  // Session management
  ipcMain.handle('config-get-session', () => {
    return configManager.getSession()
  })

  ipcMain.handle(
    'config-save-session',
    (
      _,
      session: {
        tabs: Array<{ id: string; profileId: string; workspaceId?: string; title: string }>
        activeTabId: string | null
      }
    ) => {
      configManager.saveSession(session)
    }
  )

  ipcMain.handle('config-clear-session', () => {
    configManager.clearSession()
  })

  // Backup operations
  ipcMain.handle('config-backup-create', (): string => {
    return configManager.createBackup()
  })

  ipcMain.handle('config-backup-list', (): BackupInfo[] => {
    return configManager.listBackups()
  })

  ipcMain.handle('config-backup-restore', (_, filename: string): boolean => {
    return configManager.restoreBackup(filename)
  })

  ipcMain.handle('config-backup-delete', (_, filename: string): boolean => {
    return configManager.deleteBackup(filename)
  })

  ipcMain.handle('config-validate', (): boolean => {
    return configManager.validateConfig()
  })
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow?.webContents.send('new-tab')
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow?.webContents.send('close-tab')
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('open-settings')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [{ role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Split Vertical',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => mainWindow?.webContents.send('split-vertical')
        },
        {
          label: 'Split Horizontal',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => mainWindow?.webContents.send('split-horizontal')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  createMenu()
  setupPtyHandlers()
  setupConfigHandlers()

  // Setup auto-updater (only in production)
  if (!isDev() && mainWindow) {
    updater.init()
    updater.setMainWindow(mainWindow)
    updater.setupIpcHandlers()

    setTimeout(() => {
      updater.checkForUpdates()
    }, 5000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  ptyManager?.killAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
