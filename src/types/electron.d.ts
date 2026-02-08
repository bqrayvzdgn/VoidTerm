import type { Settings, Profile, Workspace, AppConfig, SSHConnection } from './index'

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
  buffers?: Record<string, string>
}

export interface DeepLinkAction {
  type: 'open' | 'ssh' | 'run'
  cwd?: string
  host?: string
  user?: string
  cmd?: string
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

  getSSHConnections: () => Promise<SSHConnection[]>
  addSSHConnection: (connection: SSHConnection) => Promise<SSHConnection[]>
  updateSSHConnection: (id: string, updates: Partial<SSHConnection>) => Promise<SSHConnection[]>
  removeSSHConnection: (id: string) => Promise<SSHConnection[]>

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

  // Quake mode
  toggleQuakeMode: () => void
  setQuakeMode: (enabled: boolean) => void
  onQuakeModeChanged: (callback: (enabled: boolean) => void) => () => void

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

  // Terminal output
  saveTerminalOutput: (content: string) => Promise<string | null>

  // Shell validation
  shellExists: (shellPath: string) => Promise<boolean>

  // Notifications (Phase A)
  showNotification: (title: string, body: string) => void

  // OS theme tracking (Phase A)
  onThemeChanged: (callback: (isDark: boolean) => void) => () => void

  // Deep links (Phase A)
  onDeepLink: (callback: (action: DeepLinkAction) => void) => () => void

  // Buffer persistence (Phase A)
  saveBuffers: (buffers: Record<string, string>) => Promise<void>
  getBuffers: () => Promise<Record<string, string>>

  // Editor integration (Phase C)
  openInEditor: (file: string, line: number, col: number) => void

  // Config operations
  config: ConfigAPI
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
