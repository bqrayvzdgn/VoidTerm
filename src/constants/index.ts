/**
 * Uygulama genelinde kullanilan sabitler
 */

// Terminal gecikmeleri (ms)
export const TERMINAL_STARTUP_DELAY = 300
export const SSH_COMMAND_DELAY = 500
export const COPY_FEEDBACK_DURATION = 1500
export const SEARCH_FOCUS_DELAY = 0
export const RESIZE_DEBOUNCE_DELAY = 150

// Tab limitleri
export const MAX_CLOSED_TABS = 10

// Terminal varsayilanlari
export const DEFAULT_FONT_SIZE = 14
export const MIN_FONT_SIZE = 8
export const MAX_ZOOM_LEVEL = 10
export const MIN_ZOOM_LEVEL = -5
export const ZOOM_STEP = 2

// SSH varsayilanlari
export const DEFAULT_SSH_PORT = 22

// Scrollback limiti
export const DEFAULT_SCROLLBACK = 50000

// Workspace renkleri
export const WORKSPACE_COLORS = [
  '#89b4fa', '#f38ba8', '#a6e3a1', '#f9e2af',
  '#cba6f7', '#94e2d5', '#fab387', '#89dceb',
  '#74c7ec', '#eba0ac', '#b4befe', '#f5c2e7',
  '#f2cdcd', '#cdd6f4', '#bac2de', '#a6adc8'
] as const

// Workspace ikonlari
export const WORKSPACE_ICONS = [
  '⚡', '🚀', '💻', '🔧', '📁', '🎯', '⭐', '🔥',
  '💡', '🌐', '📦', '🛠️', '🎨', '📊', '🔒', '🌟',
  '💎', '🎮', '📱', '🖥️', '⚙️', '🔌', '📡', '🧪'
] as const

// Klavye kisayollari
export const DEFAULT_SHORTCUTS = {
  newTab: 'Ctrl+T',
  closeTab: 'Ctrl+W',
  splitVertical: 'Ctrl+Shift+D',
  splitHorizontal: 'Ctrl+Shift+E',
  toggleSidebar: 'Ctrl+Shift+B',
  openSettings: 'Ctrl+,',
  nextTab: 'Ctrl+Tab',
  prevTab: 'Ctrl+Shift+Tab'
} as const
