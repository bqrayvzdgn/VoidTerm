import { describe, it, expect } from 'vitest'
import { getTheme, getThemeNames, themes } from '../../themes/index'

describe('getThemeNames', () => {
  it('returns an array of theme name keys', () => {
    const names = getThemeNames()
    expect(Array.isArray(names)).toBe(true)
    expect(names.length).toBeGreaterThan(0)
  })

  it('includes dark and light themes', () => {
    const names = getThemeNames()
    expect(names).toContain('dark')
    expect(names).toContain('light')
  })

  it('matches the keys of the themes object', () => {
    expect(getThemeNames()).toEqual(Object.keys(themes))
  })
})

describe('getTheme', () => {
  it('returns a theme object for a valid name', () => {
    const theme = getTheme('dark')
    expect(theme).toBeDefined()
    expect(theme!.name).toBe('Dark')
    expect(theme!.colors.background).toBe('#000000')
  })

  it('returns undefined for an unknown theme', () => {
    expect(getTheme('nonexistent-theme')).toBeUndefined()
  })

  it('every theme has all required color properties', () => {
    const requiredColors = [
      'background',
      'foreground',
      'cursor',
      'cursorAccent',
      'selection',
      'black',
      'red',
      'green',
      'yellow',
      'blue',
      'magenta',
      'cyan',
      'white',
      'brightBlack',
      'brightRed',
      'brightGreen',
      'brightYellow',
      'brightBlue',
      'brightMagenta',
      'brightCyan',
      'brightWhite'
    ]
    for (const name of getThemeNames()) {
      const theme = getTheme(name)!
      for (const color of requiredColors) {
        expect(theme.colors).toHaveProperty(color)
      }
    }
  })
})
