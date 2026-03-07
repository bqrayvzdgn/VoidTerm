import type { Theme } from '../types'

export const themes: Record<string, Theme> = {
  dark: {
    name: 'Dark',
    colors: {
      background: '#000000',
      foreground: '#e4e4e7',
      cursor: '#e4e4e7',
      cursorAccent: '#000000',
      selection: '#1a1a2a',
      black: '#111118',
      red: '#ff6b6b',
      green: '#69db7c',
      yellow: '#ffd43b',
      blue: '#748ffc',
      magenta: '#da77f2',
      cyan: '#66d9e8',
      white: '#c1c2c5',
      brightBlack: '#4a4a5a',
      brightRed: '#ff8787',
      brightGreen: '#8ce99a',
      brightYellow: '#ffe066',
      brightBlue: '#91a7ff',
      brightMagenta: '#e599f7',
      brightCyan: '#99e9f2',
      brightWhite: '#f8f9fa'
    }
  },
  light: {
    name: 'Light',
    colors: {
      background: '#f0f1f4',
      foreground: '#2e3039',
      cursor: '#2e3039',
      cursorAccent: '#f0f1f4',
      selection: '#c8d3f0',
      black: '#2e3039',
      red: '#d93d3d',
      green: '#3a8a3a',
      yellow: '#a67108',
      blue: '#3369d6',
      magenta: '#9124a4',
      cyan: '#0173a6',
      white: '#8b8d94',
      brightBlack: '#555a68',
      brightRed: '#b8203a',
      brightGreen: '#287830',
      brightYellow: '#b88b00',
      brightBlue: '#1e56c4',
      brightMagenta: '#7a1a8f',
      brightCyan: '#006893',
      brightWhite: '#e4e5e9'
    }
  }
}

export function getThemeNames(): string[] {
  return Object.keys(themes)
}

export function getTheme(name: string): Theme | undefined {
  return themes[name]
}
