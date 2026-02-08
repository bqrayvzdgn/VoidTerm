export interface Theme {
  name: string
  colors: {
    background: string
    foreground: string
    cursor: string
    cursorAccent: string
    selection: string
    black: string
    red: string
    green: string
    yellow: string
    blue: string
    magenta: string
    cyan: string
    white: string
    brightBlack: string
    brightRed: string
    brightGreen: string
    brightYellow: string
    brightBlue: string
    brightMagenta: string
    brightCyan: string
    brightWhite: string
  }
}

export interface Profile {
  id: string
  name: string
  shell: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  icon?: string
  color?: string
  startupCommand?: string
}

export interface SSHConnection {
  id: string
  name: string
  host: string
  port: number
  username: string
  authMethod: 'password' | 'key' | 'agent'
  privateKeyPath?: string
  jumpHost?: string  // For SSH tunneling/proxy
  color?: string
  icon?: string
  lastConnected?: string
}

export interface Tab {
  id: string
  title: string
  profileId: string
  ptyId?: string
  isActive: boolean
  workspaceId?: string
  groupId?: string
}

export interface TabGroup {
  id: string
  name: string
  color: string
  isCollapsed: boolean
}

export interface Snippet {
  id: string
  name: string
  command: string
  description?: string
  category?: string
  shortcut?: string  // Örn: "Ctrl+Shift+1"
  createdAt: number
  usageCount: number
}

export interface Pane {
  id: string
  type: 'terminal' | 'split'
  direction?: 'horizontal' | 'vertical'
  children?: Pane[]
  terminalId?: string
  ratio?: number
}

export interface TerminalState {
  id: string
  ptyId: string
  profileId: string
  title: string
}

export interface Workspace {
  id: string
  name: string
  icon: string
  color: string
  isActive: boolean
}

export interface CommandBlock {
  id: string
  command: string
  cwd: string
  startLine: number
  endLine: number
  exitCode: number | null
  startTime: number
  endTime: number | null
}

export interface KeyboardShortcuts {
  newTab: string
  closeTab: string
  closePane: string
  splitVertical: string
  splitHorizontal: string
  toggleSidebar: string
  openSettings: string
  nextTab: string
  prevTab: string
  focusLeft: string
  focusRight: string
  focusUp: string
  focusDown: string
  toggleSearch: string
  clearTerminal: string
  copyText: string
  pasteText: string
  openCommandPalette: string
  openSSHManager: string
  prevCommand: string
  nextCommand: string
  hintsMode: string
  viMode: string
}

export interface Settings {
  // General
  defaultProfile: string

  // Appearance
  fontSize: number
  fontFamily: string
  lineHeight: number
  letterSpacing: number
  cursorStyle: 'block' | 'underline' | 'bar'
  cursorBlink: boolean
  theme: string
  opacity: number
  blur: boolean
  backgroundImage: string

  // Terminal
  copyOnSelect: boolean
  scrollback: number
  bellSound: boolean

  // Addons (Phase A)
  enableImages: boolean
  enableClipboard: boolean

  // Tray (Phase A)
  minimizeToTray: boolean

  // OS Theme (Phase A)
  autoTheme: boolean
  lightTheme: string
  darkTheme: string

  // Notifications (Phase A)
  notifications: boolean
  notificationDelay: number

  // Shell Integration (Phase B)
  shellIntegration: boolean

  // Editor (Phase C)
  editorCommand: string

  // Keyboard Shortcuts
  shortcuts: KeyboardShortcuts
}

export const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
  newTab: 'Ctrl+T',
  closeTab: 'Ctrl+W',
  closePane: 'Ctrl+Shift+W',
  splitVertical: 'Ctrl+Shift+D',
  splitHorizontal: 'Ctrl+Shift+E',
  toggleSidebar: 'Ctrl+Shift+B',
  openSettings: 'Ctrl+,',
  nextTab: 'Ctrl+Tab',
  prevTab: 'Ctrl+Shift+Tab',
  focusLeft: 'Ctrl+Alt+Left',
  focusRight: 'Ctrl+Alt+Right',
  focusUp: 'Ctrl+Alt+Up',
  focusDown: 'Ctrl+Alt+Down',
  toggleSearch: 'Ctrl+F',
  clearTerminal: 'Ctrl+L',
  copyText: 'Ctrl+Shift+C',
  pasteText: 'Ctrl+Shift+V',
  openCommandPalette: 'Ctrl+Shift+P',
  openSSHManager: 'Ctrl+Shift+S',
  prevCommand: 'Ctrl+Shift+ArrowUp',
  nextCommand: 'Ctrl+Shift+ArrowDown',
  hintsMode: 'Ctrl+Shift+H',
  viMode: 'Ctrl+Shift+X'
}

export const DEFAULT_SETTINGS: Settings = {
  defaultProfile: 'cmd',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Cascadia Code, Fira Code, Consolas, monospace',
  lineHeight: 1.2,
  letterSpacing: 0,
  cursorStyle: 'block',
  cursorBlink: true,
  theme: 'catppuccin-mocha',
  opacity: 1,
  blur: false,
  backgroundImage: '',
  copyOnSelect: true,
  scrollback: 50000,
  bellSound: false,
  enableImages: true,
  enableClipboard: true,
  minimizeToTray: false,
  autoTheme: false,
  lightTheme: 'github-light',
  darkTheme: 'catppuccin-mocha',
  notifications: false,
  notificationDelay: 5000,
  shellIntegration: true,
  editorCommand: 'code --goto {file}:{line}:{col}',
  shortcuts: DEFAULT_SHORTCUTS
}

export interface AppConfig {
  settings: Settings
  profiles: Profile[]
  workspaces: Workspace[]
  sshConnections: SSHConnection[]
  version: number
}
