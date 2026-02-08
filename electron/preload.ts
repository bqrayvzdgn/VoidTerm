import { contextBridge, ipcRenderer } from 'electron'

export interface PtyOptions {
  shell?: string
  cwd?: string
  env?: Record<string, string>
}

const electronAPI = {
  // Window controls
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),

  // System paths (via IPC for sandbox compatibility)
  homedir: (): Promise<string> => ipcRenderer.invoke('get-homedir'),
  pathJoin: (...args: string[]): Promise<string> => ipcRenderer.invoke('path-join', args),

  // PTY operations
  ptyCreate: (options: PtyOptions): Promise<string> =>
    ipcRenderer.invoke('pty-create', options),
  ptyWrite: (id: string, data: string) =>
    ipcRenderer.send('pty-write', { id, data }),
  ptyResize: (id: string, cols: number, rows: number) =>
    ipcRenderer.send('pty-resize', { id, cols, rows }),
  ptyKill: (id: string) =>
    ipcRenderer.send('pty-kill', id),
  ptyGetCount: (): Promise<number> =>
    ipcRenderer.invoke('pty-get-count'),
  ptyGetActiveIds: (): Promise<string[]> =>
    ipcRenderer.invoke('pty-get-active-ids'),

  // PTY event listeners
  onPtyData: (callback: (id: string, data: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, { id, data }: { id: string; data: string }) => {
      callback(id, data)
    }
    ipcRenderer.on('pty-data', handler)
    return () => ipcRenderer.removeListener('pty-data', handler)
  },
  onPtyExit: (callback: (id: string, exitCode: number) => void) => {
    const handler = (_: Electron.IpcRendererEvent, { id, exitCode }: { id: string; exitCode: number }) => {
      callback(id, exitCode)
    }
    ipcRenderer.on('pty-exit', handler)
    return () => ipcRenderer.removeListener('pty-exit', handler)
  },

  // Menu event listeners
  onNewTab: (callback: () => void) => {
    ipcRenderer.on('new-tab', callback)
    return () => ipcRenderer.removeListener('new-tab', callback)
  },
  onCloseTab: (callback: () => void) => {
    ipcRenderer.on('close-tab', callback)
    return () => ipcRenderer.removeListener('close-tab', callback)
  },
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on('open-settings', callback)
    return () => ipcRenderer.removeListener('open-settings', callback)
  },
  onSplitVertical: (callback: () => void) => {
    ipcRenderer.on('split-vertical', callback)
    return () => ipcRenderer.removeListener('split-vertical', callback)
  },
  onSplitHorizontal: (callback: () => void) => {
    ipcRenderer.on('split-horizontal', callback)
    return () => ipcRenderer.removeListener('split-horizontal', callback)
  },
  onNextTab: (callback: () => void) => {
    ipcRenderer.on('next-tab', callback)
    return () => ipcRenderer.removeListener('next-tab', callback)
  },
  onPrevTab: (callback: () => void) => {
    ipcRenderer.on('prev-tab', callback)
    return () => ipcRenderer.removeListener('prev-tab', callback)
  },

  // Window state
  onWindowMaximized: (callback: (isMaximized: boolean) => void) => {
    const handler = (_: Electron.IpcRendererEvent, isMaximized: boolean) => {
      callback(isMaximized)
    }
    ipcRenderer.on('window-maximized', handler)
    return () => ipcRenderer.removeListener('window-maximized', handler)
  },

  // Window appearance
  setOpacity: (opacity: number) => ipcRenderer.send('set-opacity', opacity),
  setBackgroundBlur: (enabled: boolean) => ipcRenderer.send('set-background-blur', enabled),
  setWindowTitle: (title: string) => ipcRenderer.send('set-window-title', title),

  // Quake mode
  toggleQuakeMode: () => ipcRenderer.send('toggle-quake-mode'),
  setQuakeMode: (enabled: boolean) => ipcRenderer.send('set-quake-mode', enabled),
  onQuakeModeChanged: (callback: (enabled: boolean) => void) => {
    const handler = (_: Electron.IpcRendererEvent, enabled: boolean) => {
      callback(enabled)
    }
    ipcRenderer.on('quake-mode-changed', handler)
    return () => ipcRenderer.removeListener('quake-mode-changed', handler)
  },

  // Shell validation
  shellExists: (shellPath: string): Promise<boolean> => ipcRenderer.invoke('shell-exists', shellPath),

  // Terminal output export
  saveTerminalOutput: (content: string): Promise<string | null> => ipcRenderer.invoke('save-terminal-output', content),

  // Platform info
  platform: process.platform,

  // Version info for About section
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome
  },

  // External links
  openExternal: (url: string) => ipcRenderer.send('open-external', url),

  // Terminal context menu
  showTerminalContextMenu: (options: { hasSelection: boolean; x: number; y: number }) =>
    ipcRenderer.send('show-terminal-context-menu', options),
  onTerminalCopy: (callback: () => void) => {
    ipcRenderer.on('terminal-copy', callback)
    return () => ipcRenderer.removeListener('terminal-copy', callback)
  },
  onTerminalPaste: (callback: () => void) => {
    ipcRenderer.on('terminal-paste', callback)
    return () => ipcRenderer.removeListener('terminal-paste', callback)
  },
  onTerminalClear: (callback: () => void) => {
    ipcRenderer.on('terminal-clear', callback)
    return () => ipcRenderer.removeListener('terminal-clear', callback)
  },

  // Desktop notifications (Phase A)
  showNotification: (title: string, body: string) =>
    ipcRenderer.send('show-notification', { title, body }),

  // OS theme tracking (Phase A)
  onThemeChanged: (callback: (isDark: boolean) => void) => {
    const handler = (_: Electron.IpcRendererEvent, isDark: boolean) => {
      callback(isDark)
    }
    ipcRenderer.on('theme-changed', handler)
    return () => ipcRenderer.removeListener('theme-changed', handler)
  },

  // Tray settings (Phase A)
  setMinimizeToTray: (enabled: boolean) =>
    ipcRenderer.send('set-minimize-to-tray', enabled),

  // Deep links (Phase A)
  onDeepLink: (callback: (action: { type: string; cwd?: string; host?: string; user?: string; cmd?: string }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, action: { type: string; cwd?: string; host?: string; user?: string; cmd?: string }) => {
      callback(action)
    }
    ipcRenderer.on('deep-link-action', handler)
    return () => ipcRenderer.removeListener('deep-link-action', handler)
  },

  // Buffer persistence (Phase A)
  saveBuffers: (buffers: Record<string, string>): Promise<void> =>
    ipcRenderer.invoke('save-buffers', buffers),
  getBuffers: (): Promise<Record<string, string>> =>
    ipcRenderer.invoke('get-buffers'),

  // Editor integration (Phase C)
  openInEditor: (file: string, line: number, col: number) =>
    ipcRenderer.send('open-in-editor', { file, line, col }),

  // Auto-update operations
  updates: {
    checkForUpdates: (): Promise<{ updateAvailable: boolean; updateInfo: { version: string; releaseNotes?: string } | null }> =>
      ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: (): Promise<boolean> =>
      ipcRenderer.invoke('download-update'),
    installUpdate: (): Promise<void> =>
      ipcRenderer.invoke('install-update'),
    getStatus: (): Promise<{ isUpdateAvailable: boolean; updateInfo: { version: string; releaseNotes?: string } | null }> =>
      ipcRenderer.invoke('get-update-status'),

    // Update event listeners
    onChecking: (callback: () => void) => {
      ipcRenderer.on('update-checking', callback)
      return () => ipcRenderer.removeListener('update-checking', callback)
    },
    onAvailable: (callback: (info: { version: string; releaseNotes?: string }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, info: { version: string; releaseNotes?: string }) => callback(info)
      ipcRenderer.on('update-available', handler)
      return () => ipcRenderer.removeListener('update-available', handler)
    },
    onNotAvailable: (callback: (info: { version: string }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, info: { version: string }) => callback(info)
      ipcRenderer.on('update-not-available', handler)
      return () => ipcRenderer.removeListener('update-not-available', handler)
    },
    onProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => callback(progress)
      ipcRenderer.on('update-download-progress', handler)
      return () => ipcRenderer.removeListener('update-download-progress', handler)
    },
    onDownloaded: (callback: (info: { version: string; releaseNotes?: string }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, info: { version: string; releaseNotes?: string }) => callback(info)
      ipcRenderer.on('update-downloaded', handler)
      return () => ipcRenderer.removeListener('update-downloaded', handler)
    },
    onError: (callback: (error: { message: string }) => void) => {
      const handler = (_: Electron.IpcRendererEvent, error: { message: string }) => callback(error)
      ipcRenderer.on('update-error', handler)
      return () => ipcRenderer.removeListener('update-error', handler)
    }
  },

  // Config operations
  config: {
    // Get entire config
    get: () => ipcRenderer.invoke('config-get'),
    getPath: () => ipcRenderer.invoke('config-get-path'),

    // Settings
    getSettings: () => ipcRenderer.invoke('config-get-settings'),
    updateSettings: (updates: Record<string, unknown>) => ipcRenderer.invoke('config-update-settings', updates),
    resetSettings: () => ipcRenderer.invoke('config-reset-settings'),

    // Profiles
    getProfiles: () => ipcRenderer.invoke('config-get-profiles'),
    addProfile: (profile: Record<string, unknown>) => ipcRenderer.invoke('config-add-profile', profile),
    updateProfile: (id: string, updates: Record<string, unknown>) => ipcRenderer.invoke('config-update-profile', { id, updates }),
    removeProfile: (id: string) => ipcRenderer.invoke('config-remove-profile', id),

    // Workspaces
    getWorkspaces: () => ipcRenderer.invoke('config-get-workspaces'),
    addWorkspace: (workspace: Record<string, unknown>) => ipcRenderer.invoke('config-add-workspace', workspace),
    updateWorkspace: (id: string, updates: Record<string, unknown>) => ipcRenderer.invoke('config-update-workspace', { id, updates }),
    removeWorkspace: (id: string) => ipcRenderer.invoke('config-remove-workspace', id),

    // SSH Connections
    getSSHConnections: (): Promise<Array<{
      id: string
      name: string
      host: string
      port: number
      username: string
      authMethod: 'password' | 'key' | 'agent'
      privateKeyPath?: string
      jumpHost?: string
      color?: string
      icon?: string
      lastConnected?: string
    }>> => ipcRenderer.invoke('config-get-ssh-connections'),
    addSSHConnection: (connection: Record<string, unknown>) => ipcRenderer.invoke('config-add-ssh-connection', connection),
    updateSSHConnection: (id: string, updates: Record<string, unknown>) => ipcRenderer.invoke('config-update-ssh-connection', { id, updates }),
    removeSSHConnection: (id: string) => ipcRenderer.invoke('config-remove-ssh-connection', id),

    // Import/Export
    export: () => ipcRenderer.invoke('config-export'),
    import: (jsonString: string) => ipcRenderer.invoke('config-import', jsonString),

    // Reset
    reset: () => ipcRenderer.invoke('config-reset'),

    // Session
    getSession: () => ipcRenderer.invoke('config-get-session'),
    saveSession: (session: { tabs: Array<{ id: string; profileId: string; workspaceId?: string; title: string }>; activeTabId: string | null }) =>
      ipcRenderer.invoke('config-save-session', session),
    clearSession: () => ipcRenderer.invoke('config-clear-session'),

    // Backup operations
    backup: {
      create: (): Promise<string> => ipcRenderer.invoke('config-backup-create'),
      list: (): Promise<Array<{ filename: string; timestamp: number; date: string; size: number }>> =>
        ipcRenderer.invoke('config-backup-list'),
      restore: (filename: string): Promise<boolean> =>
        ipcRenderer.invoke('config-backup-restore', filename),
      delete: (filename: string): Promise<boolean> =>
        ipcRenderer.invoke('config-backup-delete', filename)
    },
    validate: (): Promise<boolean> => ipcRenderer.invoke('config-validate')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}
