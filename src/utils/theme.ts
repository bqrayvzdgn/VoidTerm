import type { Theme } from '../types'
import type { ITheme } from '@xterm/xterm'
import { themes } from '../themes'

const DEFAULT_THEME_NAME = 'dark'

/**
 * Resolves a theme name to a Theme object
 * Falls back to default theme if not found
 */
export function resolveTheme(themeName: string): Theme {
  return themes[themeName] || themes[DEFAULT_THEME_NAME]
}

/**
 * Converts a Theme object to xterm ITheme format
 */
export function mapThemeToXterm(theme: Theme): ITheme {
  return {
    background: theme.colors.background,
    foreground: theme.colors.foreground,
    cursor: theme.colors.cursor,
    cursorAccent: theme.colors.cursorAccent,
    selectionBackground: theme.colors.selection,
    black: theme.colors.black,
    red: theme.colors.red,
    green: theme.colors.green,
    yellow: theme.colors.yellow,
    blue: theme.colors.blue,
    magenta: theme.colors.magenta,
    cyan: theme.colors.cyan,
    white: theme.colors.white,
    brightBlack: theme.colors.brightBlack,
    brightRed: theme.colors.brightRed,
    brightGreen: theme.colors.brightGreen,
    brightYellow: theme.colors.brightYellow,
    brightBlue: theme.colors.brightBlue,
    brightMagenta: theme.colors.brightMagenta,
    brightCyan: theme.colors.brightCyan,
    brightWhite: theme.colors.brightWhite
  }
}

/**
 * Generates CSS custom properties from theme colors
 */
export function getThemeCSSVariables(theme: Theme): Record<string, string> {
  return {
    '--terminal-background': theme.colors.background,
    '--terminal-foreground': theme.colors.foreground,
    '--terminal-cursor': theme.colors.cursor,
    '--terminal-selection': theme.colors.selection
  }
}
