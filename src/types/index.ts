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
  // SSH profile fields
  type?: 'local' | 'ssh'
  sshHost?: string
  sshPort?: number
  sshUsername?: string
  sshAuthMethod?: 'password' | 'key' | 'agent'
  sshKeyPath?: string
}

export interface Tab {
  id: string
  title: string
  profileId: string
  ptyId?: string
  isActive: boolean
  workspaceId?: string
  color?: string
  pinned?: boolean
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

  // Terminal
  terminalPadding: number
  copyOnSelect: boolean
  scrollback: number
  bellSound: boolean

  // Quake Mode
  quakeMode: boolean
  quakeShortcut: string
  quakeHeight: number

  // Background Image
  backgroundImage: string
  backgroundOpacity: number
  backgroundBlur: number

  // Shell Integration
  shellIntegration: boolean

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
  openCommandPalette: 'Ctrl+Shift+P'
}

export const DEFAULT_SETTINGS: Settings = {
  defaultProfile: 'powershell',
  fontSize: 14,
  fontFamily: "'Cascadia Code', monospace",
  lineHeight: 1.2,
  letterSpacing: 0,
  cursorStyle: 'block',
  cursorBlink: true,
  theme: 'dark',
  opacity: 1,
  blur: false,
  terminalPadding: 8,
  copyOnSelect: false,
  scrollback: 10000,
  bellSound: false,
  quakeMode: false,
  quakeShortcut: 'Ctrl+`',
  quakeHeight: 50,
  backgroundImage: '',
  backgroundOpacity: 0.15,
  backgroundBlur: 0,
  shellIntegration: true,
  shortcuts: DEFAULT_SHORTCUTS
}

export interface AppConfig {
  settings: Settings
  profiles: Profile[]
  workspaces: Workspace[]
  version: number
}
