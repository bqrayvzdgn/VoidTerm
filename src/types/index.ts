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

export interface Tab {
  id: string
  title: string
  profileId: string
  ptyId?: string
  isActive: boolean
  workspaceId?: string
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
  splitVertical: string
  splitHorizontal: string
  toggleSidebar: string
  openSettings: string
  nextTab: string
  prevTab: string
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

  // Keyboard Shortcuts
  shortcuts: KeyboardShortcuts
}

export const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
  newTab: 'Ctrl+T',
  closeTab: 'Ctrl+W',
  splitVertical: 'Ctrl+Shift+D',
  splitHorizontal: 'Ctrl+Shift+E',
  toggleSidebar: 'Ctrl+Shift+B',
  openSettings: 'Ctrl+,',
  nextTab: 'Ctrl+Tab',
  prevTab: 'Ctrl+Shift+Tab'
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
  shortcuts: DEFAULT_SHORTCUTS
}

export interface AppConfig {
  settings: Settings
  profiles: Profile[]
  workspaces: Workspace[]
  version: number
}
