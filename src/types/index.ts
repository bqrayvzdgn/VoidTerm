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

export interface Snippet {
  id: string
  name: string
  command: string
  description?: string
  category?: string
  shortcut?: string
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
  openSnippets: string
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
  copyOnSelect: boolean
  scrollback: number
  bellSound: boolean

  // Addons
  enableImages: boolean
  enableClipboard: boolean

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
  openCommandPalette: 'Ctrl+Shift+P',
  openSnippets: 'Ctrl+Shift+N'
}

export const DEFAULT_SETTINGS: Settings = {
  defaultProfile: 'cmd',
  fontSize: 14,
  fontFamily: 'Cascadia Code, monospace',
  lineHeight: 1.2,
  letterSpacing: 0,
  cursorStyle: 'block',
  cursorBlink: true,
  theme: 'dark',
  opacity: 1,
  blur: false,
  copyOnSelect: true,
  scrollback: 50000,
  bellSound: false,
  enableImages: true,
  enableClipboard: true,
  shellIntegration: true,
  shortcuts: DEFAULT_SHORTCUTS
}

export interface AppConfig {
  settings: Settings
  profiles: Profile[]
  workspaces: Workspace[]
  version: number
}
