import { app, BrowserWindow, ipcMain, Menu, shell, globalShortcut, screen, session, dialog, Notification, nativeTheme } from 'electron'
import { exec } from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { PtyManager } from './pty-manager'
import { configManager, Profile, Settings, Workspace, BackupInfo, SSHConnection } from './config-manager'
import { updater } from './auto-updater'
import { createLogger } from './logger'
import { isAllowed, RATE_LIMITS } from './rate-limiter'
import { TrayManager } from './tray-manager'
import { parseDeepLink } from './deep-link-handler'

const logger = createLogger('Main')

let mainWindow: BrowserWindow | null = null
let ptyManager: PtyManager
let trayManager: TrayManager | null = null
let isQuakeMode = false
let quakeWindowBounds: { x: number; y: number; width: number; height: number } | null = null
let normalWindowBounds: { x: number; y: number; width: number; height: number } | null = null
let minimizeToTray = false
let pendingDeepLink: string | null = null

let _isDev: boolean | null = null
function isDev(): boolean {
  if (_isDev === null) _isDev = !app.isPackaged
  return _isDev
}

function createWindow() {
  // Platform-specific window options
  const isWindows = process.platform === 'win32'
  const isMac = process.platform === 'darwin'

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    frame: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    // Windows 11 provides rounded corners automatically for frameless windows
    // On macOS, vibrancy can be used for blur effects
    transparent: false,
    backgroundColor: '#1e1e2e',
    // Windows 11: Use mica/acrylic for better appearance
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
    // DevTools can be opened manually with F12 or Ctrl+Shift+I
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

  // Minimize to tray instead of closing when tray is enabled
  mainWindow.on('close', (event) => {
    if (minimizeToTray && trayManager?.shouldPreventClose()) {
      event.preventDefault()
      mainWindow?.hide()
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
        // Windows: Use backgroundMaterial for blur effect (Windows 11)
        // or setBackgroundMaterial on older Windows
        try {
          mainWindow.setBackgroundMaterial(enabled ? 'acrylic' : 'none')
        } catch {
          // Fallback for older Electron versions or Windows 10
          mainWindow.setBackgroundColor(enabled ? '#00000000' : '#0c0c0c')
        }
      } else if (process.platform === 'darwin') {
        // macOS: Use vibrancy
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

  // Terminal output export
  ipcMain.handle('save-terminal-output', async (_, content: string) => {
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Terminal Output',
      defaultPath: `terminal-output-${Date.now()}.txt`,
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'Log Files', extensions: ['log'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, content, 'utf-8')
      return result.filePath
    }
    return null
  })

  // System info (moved from preload for sandbox compatibility)
  ipcMain.handle('get-homedir', () => os.homedir())
  ipcMain.handle('path-join', (_, args: string[]) => path.join(...args))
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
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: mainWindow!, x: options.x, y: options.y })
  })

  // Quake mode toggle
  ipcMain.on('toggle-quake-mode', () => {
    toggleQuakeMode()
  })

  ipcMain.on('set-quake-mode', (_, enabled: boolean) => {
    if (enabled && !isQuakeMode) {
      enableQuakeMode()
    } else if (!enabled && isQuakeMode) {
      disableQuakeMode()
    }
  })

  // Desktop notifications (Phase A)
  ipcMain.on('show-notification', (_, { title, body }: { title: string; body: string }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })

  // Tray enable/disable
  ipcMain.on('set-minimize-to-tray', (_, enabled: boolean) => {
    minimizeToTray = enabled
    if (enabled && !trayManager && mainWindow) {
      trayManager = new TrayManager()
      trayManager.init(mainWindow)
    } else if (!enabled && trayManager) {
      trayManager.dispose()
      trayManager = null
    }
  })

  // Buffer persistence (Phase A)
  ipcMain.handle('save-buffers', async (_, buffers: Record<string, string>) => {
    const bufferPath = path.join(app.getPath('userData'), 'buffers.json')
    try {
      await fs.promises.writeFile(bufferPath, JSON.stringify(buffers), 'utf-8')
    } catch (error) {
      logger.error('Failed to save buffers:', error)
    }
  })

  ipcMain.handle('get-buffers', async () => {
    const bufferPath = path.join(app.getPath('userData'), 'buffers.json')
    try {
      const data = await fs.promises.readFile(bufferPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return {}
    }
  })

  // Editor integration (Phase C)
  ipcMain.on('open-in-editor', (_, { file, line, col }: { file: string; line: number; col: number }) => {
    const settings = configManager.getSettings()
    const cmd = (settings.editorCommand || 'code --goto {file}:{line}:{col}')
      .replace('{file}', file)
      .replace('{line}', String(line))
      .replace('{col}', String(col))

    exec(cmd, (error) => {
      if (error) {
        logger.error('Failed to open editor:', error)
      }
    })
  })
}

function toggleQuakeMode() {
  if (!mainWindow) return

  if (isQuakeMode) {
    disableQuakeMode()
  } else {
    enableQuakeMode()
  }
}

function enableQuakeMode() {
  if (!mainWindow) return

  // Save current window bounds
  normalWindowBounds = mainWindow.getBounds()

  // Get the primary display
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth } = primaryDisplay.workAreaSize

  // Set quake mode window bounds (top of screen, full width, 40% height)
  const quakeHeight = Math.round(primaryDisplay.workAreaSize.height * 0.4)
  quakeWindowBounds = {
    x: 0,
    y: 0,
    width: screenWidth,
    height: quakeHeight
  }

  mainWindow.setBounds(quakeWindowBounds)
  mainWindow.setAlwaysOnTop(true)
  isQuakeMode = true

  mainWindow.webContents.send('quake-mode-changed', true)
}

function disableQuakeMode() {
  if (!mainWindow) return

  // Restore normal window bounds
  if (normalWindowBounds) {
    mainWindow.setBounds(normalWindowBounds)
  }

  mainWindow.setAlwaysOnTop(false)
  isQuakeMode = false

  mainWindow.webContents.send('quake-mode-changed', false)
}

function setupGlobalShortcuts() {
  // F12 to toggle quake mode (show/hide terminal)
  globalShortcut.register('F12', () => {
    if (!mainWindow) return

    if (mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide()
    } else {
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()
      if (isQuakeMode) {
        // Re-apply quake bounds in case display changed
        enableQuakeMode()
      }
    }
  })

  // Ctrl+` as alternative toggle
  globalShortcut.register('Ctrl+`', () => {
    toggleQuakeMode()
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
    ptyManager.kill(id)
  })

  // Get active PTY count (useful for debugging)
  ipcMain.handle('pty-get-count', () => {
    return ptyManager.getCount()
  })

  // Get list of active PTY IDs
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
  // Get entire config
  ipcMain.handle('config-get', () => {
    return configManager.getConfig()
  })

  // Get config file path
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

  // SSH Connections
  ipcMain.handle('config-get-ssh-connections', () => {
    return configManager.getSSHConnections()
  })

  ipcMain.handle('config-add-ssh-connection', (_, connection: SSHConnection) => {
    return configManager.addSSHConnection(connection)
  })

  ipcMain.handle('config-update-ssh-connection', (_, { id, updates }: { id: string; updates: Partial<SSHConnection> }) => {
    return configManager.updateSSHConnection(id, updates)
  })

  ipcMain.handle('config-remove-ssh-connection', (_, id: string) => {
    return configManager.removeSSHConnection(id)
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

  // Reset entire config
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

  ipcMain.handle('config-save-session', (_, session: { tabs: Array<{ id: string; profileId: string; workspaceId?: string; title: string }>; activeTabId: string | null }) => {
    configManager.saveSession(session)
  })

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
      submenu: [
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
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

// Register deep link protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('voidterm', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('voidterm')
}

// Handle deep link on Windows/Linux (second-instance)
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // The deep link URL is typically the last argument
    const url = commandLine.find(arg => arg.startsWith('voidterm://'))
    if (url) {
      handleDeepLink(url)
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Handle deep link on macOS
app.on('open-url', (event, url) => {
  event.preventDefault()
  if (mainWindow) {
    handleDeepLink(url)
  } else {
    pendingDeepLink = url
  }
})

function handleDeepLink(url: string) {
  const action = parseDeepLink(url)
  if (action && mainWindow) {
    // For 'run' commands, show confirmation dialog
    if (action.type === 'run' && action.cmd) {
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Deep Link Command',
        message: `An external application wants to run a command:\n\n${action.cmd}\n\nAllow this?`,
        buttons: ['Cancel', 'Allow'],
        defaultId: 0,
        cancelId: 0
      }).then((result) => {
        if (result.response === 1) {
          mainWindow?.webContents.send('deep-link-action', action)
        }
      })
    } else {
      mainWindow.webContents.send('deep-link-action', action)
    }
  }
}

app.whenReady().then(() => {
  createWindow()
  createMenu()
  setupPtyHandlers()
  setupConfigHandlers()
  setupGlobalShortcuts()

  // OS theme tracking (Phase A)
  nativeTheme.on('updated', () => {
    mainWindow?.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors)
  })

  // Initialize tray if setting is enabled
  const settings = configManager.getSettings()
  minimizeToTray = settings.minimizeToTray || false
  if (minimizeToTray && mainWindow) {
    trayManager = new TrayManager()
    trayManager.init(mainWindow)
  }

  // Handle pending deep link
  if (pendingDeepLink) {
    handleDeepLink(pendingDeepLink)
    pendingDeepLink = null
  }

  // Setup auto-updater (only in production)
  if (!isDev() && mainWindow) {
    updater.init()
    updater.setMainWindow(mainWindow)
    updater.setupIpcHandlers()

    // Check for updates after a short delay
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

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  ptyManager?.killAll()
  trayManager?.dispose()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
