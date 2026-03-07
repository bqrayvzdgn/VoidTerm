import type { Settings, Profile, Workspace, AppConfig } from './index'

export interface SessionTab {
  id: string
  profileId: string
  workspaceId?: string
  title: string
}

export interface Session {
  tabs: SessionTab[]
  activeTabId: string | null
  activeWorkspaceId?: string
}

export interface BackupInfo {
  filename: string
  timestamp: number
  date: string
  size: number
}

export interface PtyOptions {
  shell?: string
  cwd?: string
  env?: Record<string, string>
}

export interface ConfigAPI {
  get: () => Promise<AppConfig>
  getPath: () => Promise<string>

  getSettings: () => Promise<Settings>
  updateSettings: (updates: Partial<Settings>) => Promise<Settings>
  resetSettings: () => Promise<Settings>

  getProfiles: () => Promise<Profile[]>
  addProfile: (profile: Profile) => Promise<Profile[]>
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<Profile[]>
  removeProfile: (id: string) => Promise<Profile[]>

  getWorkspaces: () => Promise<Workspace[]>
  addWorkspace: (workspace: Workspace) => Promise<Workspace[]>
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<Workspace[]>
  removeWorkspace: (id: string) => Promise<Workspace[]>

  export: () => Promise<string>
  import: (jsonString: string) => Promise<AppConfig>
  reset: () => Promise<AppConfig>

  getSession: () => Promise<Session | undefined>
  saveSession: (session: Session) => Promise<void>
  clearSession: () => Promise<void>

  backup: {
    create: () => Promise<string>
    list: () => Promise<BackupInfo[]>
    restore: (filename: string) => Promise<boolean>
    delete: (filename: string) => Promise<boolean>
  }
  validate: () => Promise<boolean>
}

export interface ElectronAPI {
  // Window controls
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void

  // System paths
  homedir: () => string
  pathJoin: (...args: string[]) => string

  // PTY operations
  ptyCreate: (options: PtyOptions) => Promise<string>
  ptyWrite: (id: string, data: string) => void
  ptyResize: (id: string, cols: number, rows: number) => void
  ptyKill: (id: string) => void

  // PTY event listeners
  onPtyData: (callback: (id: string, data: string) => void) => () => void
  onPtyExit: (callback: (id: string, exitCode: number) => void) => () => void

  // Menu event listeners
  onNewTab: (callback: () => void) => () => void
  onCloseTab: (callback: () => void) => () => void
  onOpenSettings: (callback: () => void) => () => void
  onSplitVertical: (callback: () => void) => () => void
  onSplitHorizontal: (callback: () => void) => () => void
  onNextTab: (callback: () => void) => () => void
  onPrevTab: (callback: () => void) => () => void

  // Window state
  onWindowMaximized: (callback: (isMaximized: boolean) => void) => () => void

  // Window appearance
  setOpacity: (opacity: number) => void
  setBackgroundBlur: (enabled: boolean) => void
  setWindowTitle: (title: string) => void

  // Platform info
  platform: NodeJS.Platform

  // Version info
  versions: {
    electron: string
    node: string
    chrome: string
  }

  // External links
  openExternal: (url: string) => void

  // Terminal context menu
  showTerminalContextMenu: (options: { hasSelection: boolean; x: number; y: number }) => void
  onTerminalCopy: (callback: () => void) => () => void
  onTerminalPaste: (callback: () => void) => () => void
  onTerminalClear: (callback: () => void) => () => void
  onTerminalSelectAll: (callback: () => void) => () => void
  onTerminalSearch: (callback: () => void) => () => void
  onTerminalSplitRight: (callback: () => void) => () => void
  onTerminalSplitDown: (callback: () => void) => () => void
  onTerminalReset: (callback: () => void) => () => void

  // Shell validation
  shellExists: (shellPath: string) => Promise<boolean>

  // PTY info
  ptyGetCount: () => Promise<number>
  ptyGetActiveIds: () => Promise<string[]>

  // Auto-update operations
  updates: {
    checkForUpdates: () => Promise<{
      updateAvailable: boolean
      updateInfo: { version: string; releaseNotes?: string } | null
    }>
    downloadUpdate: () => Promise<boolean>
    installUpdate: () => Promise<void>
    getStatus: () => Promise<{
      isUpdateAvailable: boolean
      updateInfo: { version: string; releaseNotes?: string } | null
    }>
    onChecking: (callback: () => void) => () => void
    onAvailable: (callback: (info: { version: string; releaseNotes?: string }) => void) => () => void
    onNotAvailable: (callback: (info: { version: string }) => void) => () => void
    onProgress: (
      callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void
    ) => () => void
    onDownloaded: (callback: (info: { version: string; releaseNotes?: string }) => void) => () => void
    onError: (callback: (error: { message: string }) => void) => () => void
  }

  // Config operations
  config: ConfigAPI
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
