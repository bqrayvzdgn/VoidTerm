import { useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function getLuminance(hex: string): number {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) / 255
  const g = ((num >> 8) & 0xff) / 255
  const b = (num & 0xff) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const useThemeManager = () => {
  const { settings, currentTheme } = useSettingsStore()

  // Apply window appearance settings
  useEffect(() => {
    if (window.electronAPI?.setOpacity) {
      window.electronAPI.setOpacity(settings.opacity)
    }
  }, [settings.opacity])

  useEffect(() => {
    if (window.electronAPI?.setBackgroundBlur) {
      window.electronAPI.setBackgroundBlur(settings.blur)
    }
  }, [settings.blur])

  // Apply theme colors to all CSS variables
  useEffect(() => {
    const root = document.documentElement
    const bg = currentTheme.colors.background
    const fg = currentTheme.colors.foreground
    const isDark = getLuminance(bg) < 0.5

    // Terminal
    root.style.setProperty('--bg-terminal', bg)

    // Layered backgrounds — light themes need larger shifts for visible differentiation
    root.style.setProperty('--bg-base', bg)
    if (isDark) {
      root.style.setProperty('--bg-surface', adjustColor(bg, 12))
      root.style.setProperty('--bg-elevated', adjustColor(bg, 20))
      root.style.setProperty('--bg-overlay', adjustColor(bg, 30))
    } else {
      root.style.setProperty('--bg-surface', adjustColor(bg, -20))
      root.style.setProperty('--bg-elevated', adjustColor(bg, -34))
      root.style.setProperty('--bg-overlay', adjustColor(bg, -48))
    }

    // Hover/active states
    if (isDark) {
      root.style.setProperty('--bg-hover', 'rgba(255, 255, 255, 0.04)')
      root.style.setProperty('--bg-active', 'rgba(255, 255, 255, 0.08)')
    } else {
      root.style.setProperty('--bg-hover', 'rgba(0, 0, 0, 0.06)')
      root.style.setProperty('--bg-active', 'rgba(0, 0, 0, 0.10)')
    }

    // Tab bar
    if (isDark) {
      root.style.setProperty('--bg-tabbar', adjustColor(bg, 8))
      root.style.setProperty('--bg-tab-active', bg)
      root.style.setProperty('--bg-tab-hover', adjustColor(bg, 18))
    } else {
      root.style.setProperty('--bg-tabbar', adjustColor(bg, -14))
      root.style.setProperty('--bg-tab-active', bg)
      root.style.setProperty('--bg-tab-hover', adjustColor(bg, -28))
    }

    // Text
    root.style.setProperty('--text-primary', fg)
    root.style.setProperty('--text-secondary', isDark ? '#a1a1aa' : '#4b5563')
    root.style.setProperty('--text-muted', isDark ? '#52525b' : '#7c8190')
    root.style.setProperty('--text-inverse', isDark ? '#0a0a0f' : '#f0f1f4')

    // Borders
    if (isDark) {
      root.style.setProperty('--border', 'rgba(255, 255, 255, 0.06)')
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.06)')
      root.style.setProperty('--border-subtle', 'rgba(255, 255, 255, 0.03)')
      root.style.setProperty('--border-light', 'rgba(255, 255, 255, 0.12)')
    } else {
      root.style.setProperty('--border', 'rgba(0, 0, 0, 0.13)')
      root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.13)')
      root.style.setProperty('--border-subtle', 'rgba(0, 0, 0, 0.07)')
      root.style.setProperty('--border-light', 'rgba(0, 0, 0, 0.20)')
    }

    // Shadows
    if (isDark) {
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.3)')
      root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.3)')
      root.style.setProperty('--shadow-md', '0 4px 12px rgba(0, 0, 0, 0.4)')
      root.style.setProperty('--shadow-lg', '0 8px 20px rgba(0, 0, 0, 0.35)')
    } else {
      root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.10)')
      root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0, 0, 0, 0.08)')
      root.style.setProperty('--shadow-md', '0 4px 12px rgba(0, 0, 0, 0.12)')
      root.style.setProperty('--shadow-lg', '0 8px 24px rgba(0, 0, 0, 0.16)')
    }

    // Body background
    document.body.style.backgroundColor = bg
  }, [currentTheme])

  // Apply terminal padding
  useEffect(() => {
    document.documentElement.style.setProperty('--terminal-padding', `${settings.terminalPadding}px`)
  }, [settings.terminalPadding])

  // Apply background image settings
  useEffect(() => {
    const root = document.documentElement
    if (settings.backgroundImage) {
      root.style.setProperty('--bg-image', `url(${settings.backgroundImage})`)
      root.style.setProperty('--bg-image-opacity', String(settings.backgroundOpacity))
      root.style.setProperty('--bg-image-blur', `${settings.backgroundBlur}px`)
    } else {
      root.style.setProperty('--bg-image', 'none')
      root.style.setProperty('--bg-image-opacity', '0')
    }
  }, [settings.backgroundImage, settings.backgroundOpacity, settings.backgroundBlur])

  return { currentTheme }
}
