import type { Theme } from '../types'
import type { ITheme } from '@xterm/xterm'

/**
 * Theme nesnesini xterm ITheme formatina donusturur
 * Bu fonksiyon TerminalView'da tema tekrarini onler
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
 * Tema renklerinden CSS degiskenleri olusturur
 */
export function getThemeCSSVariables(theme: Theme): Record<string, string> {
  return {
    '--terminal-background': theme.colors.background,
    '--terminal-foreground': theme.colors.foreground,
    '--terminal-cursor': theme.colors.cursor,
    '--terminal-selection': theme.colors.selection
  }
}
