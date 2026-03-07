import { vi } from 'vitest'

const mockElectronAPI = {
  // Window controls
  windowMinimize: vi.fn(),
  windowMaximize: vi.fn(),
  windowClose: vi.fn(),

  // System paths
  homedir: vi.fn().mockResolvedValue('/home/user'),
  pathJoin: vi.fn().mockResolvedValue('/joined/path'),

  // PTY operations
  ptyCreate: vi.fn().mockResolvedValue('test-pty-id'),
  ptyWrite: vi.fn(),
  ptyResize: vi.fn(),
  ptyKill: vi.fn(),
  ptyGetCount: vi.fn().mockResolvedValue(0),
  ptyGetActiveIds: vi.fn().mockResolvedValue([]),

  // PTY event listeners
  onPtyData: vi.fn().mockReturnValue(vi.fn()),
  onPtyExit: vi.fn().mockReturnValue(vi.fn()),

  // Menu event listeners
  onNewTab: vi.fn().mockReturnValue(vi.fn()),
  onCloseTab: vi.fn().mockReturnValue(vi.fn()),
  onOpenSettings: vi.fn().mockReturnValue(vi.fn()),
  onSplitVertical: vi.fn().mockReturnValue(vi.fn()),
  onSplitHorizontal: vi.fn().mockReturnValue(vi.fn()),
  onNextTab: vi.fn().mockReturnValue(vi.fn()),
  onPrevTab: vi.fn().mockReturnValue(vi.fn()),

  // Window state
  onWindowMaximized: vi.fn().mockReturnValue(vi.fn()),

  // Window appearance
  setOpacity: vi.fn(),
  setBackgroundBlur: vi.fn(),
  setWindowTitle: vi.fn(),

  // Shell validation
  shellExists: vi.fn().mockResolvedValue(true),

  // Platform info
  platform: 'win32',

  // Version info
  versions: {
    electron: '28.0.0',
    node: '18.0.0',
    chrome: '120.0.0'
  },

  // External links
  openExternal: vi.fn(),

  // Terminal context menu
  showTerminalContextMenu: vi.fn(),
  onTerminalCopy: vi.fn().mockReturnValue(vi.fn()),
  onTerminalPaste: vi.fn().mockReturnValue(vi.fn()),
  onTerminalClear: vi.fn().mockReturnValue(vi.fn()),

  // Auto-update operations
  updates: {
    checkForUpdates: vi.fn().mockResolvedValue({ updateAvailable: false, updateInfo: null }),
    downloadUpdate: vi.fn().mockResolvedValue(false),
    installUpdate: vi.fn().mockResolvedValue(undefined),
    getStatus: vi.fn().mockResolvedValue({ isUpdateAvailable: false, updateInfo: null }),
    onChecking: vi.fn().mockReturnValue(vi.fn()),
    onAvailable: vi.fn().mockReturnValue(vi.fn()),
    onNotAvailable: vi.fn().mockReturnValue(vi.fn()),
    onProgress: vi.fn().mockReturnValue(vi.fn()),
    onDownloaded: vi.fn().mockReturnValue(vi.fn()),
    onError: vi.fn().mockReturnValue(vi.fn())
  },

  // Config operations
  config: {
    get: vi.fn().mockResolvedValue({}),
    getPath: vi.fn().mockResolvedValue('/config/path'),
    getSettings: vi.fn().mockResolvedValue({}),
    updateSettings: vi.fn().mockResolvedValue(undefined),
    resetSettings: vi.fn().mockResolvedValue(undefined),
    getProfiles: vi.fn().mockResolvedValue([]),
    addProfile: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    removeProfile: vi.fn().mockResolvedValue(undefined),
    getWorkspaces: vi.fn().mockResolvedValue([]),
    addWorkspace: vi.fn().mockResolvedValue(undefined),
    updateWorkspace: vi.fn().mockResolvedValue(undefined),
    removeWorkspace: vi.fn().mockResolvedValue(undefined),
    export: vi.fn().mockResolvedValue('{}'),
    import: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue(undefined),
    getSession: vi.fn().mockResolvedValue(null),
    saveSession: vi.fn().mockResolvedValue(undefined),
    clearSession: vi.fn().mockResolvedValue(undefined),
    backup: {
      create: vi.fn().mockResolvedValue('backup-file.json'),
      list: vi.fn().mockResolvedValue([]),
      restore: vi.fn().mockResolvedValue(true),
      delete: vi.fn().mockResolvedValue(true)
    },
    validate: vi.fn().mockResolvedValue(true)
  }
}

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue('')
  },
  writable: true
})
