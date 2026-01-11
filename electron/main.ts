import { app, BrowserWindow, ipcMain, Menu, shell, globalShortcut, screen } from 'electron'
import path from 'path'
import { PtyManager } from './pty-manager'
import { configManager, Profile, Settings, Workspace } from './config-manager'
import { updater } from './auto-updater'

let mainWindow: BrowserWindow | null = null
let ptyManager: PtyManager
let isQuakeMode = false
let quakeWindowBounds: { x: number; y: number; width: number; height: number } | null = null
let normalWindowBounds: { x: number; y: number; width: number; height: number } | null = null

const isDev = !app.isPackaged

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
      sandbox: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
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

  // External links
  ipcMain.on('open-external', (_, url: string) => {
    shell.openExternal(url)
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
    const id = ptyManager.create(options)
    return id
  })

  ipcMain.on('pty-write', (_, { id, data }: { id: string; data: string }) => {
    ptyManager.write(id, data)
  })

  ipcMain.on('pty-resize', (_, { id, cols, rows }: { id: string; cols: number; rows: number }) => {
    ptyManager.resize(id, cols, rows)
  })

  ipcMain.on('pty-kill', (_, id: string) => {
    ptyManager.kill(id)
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
    return configManager.importConfig(jsonString)
  })

  // Reset entire config
  ipcMain.handle('config-reset', () => {
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

app.whenReady().then(() => {
  createWindow()
  createMenu()
  setupPtyHandlers()
  setupConfigHandlers()
  setupGlobalShortcuts()

  // Setup auto-updater (only in production)
  if (!isDev && mainWindow) {
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
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
