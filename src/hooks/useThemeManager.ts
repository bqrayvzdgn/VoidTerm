import { useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'

export const useThemeManager = () => {
  const { settings, currentTheme, setTheme } = useSettingsStore()

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

  // OS theme tracking (Phase A)
  useEffect(() => {
    if (!settings.autoTheme) return

    const removeListener = window.electronAPI.onThemeChanged?.((isDark: boolean) => {
      const targetTheme = isDark ? settings.darkTheme : settings.lightTheme
      if (targetTheme) {
        setTheme(targetTheme)
      }
    })

    return () => {
      removeListener?.()
    }
  }, [settings.autoTheme, settings.darkTheme, settings.lightTheme, setTheme])

  // Apply theme colors to CSS variables
  useEffect(() => {
    const root = document.documentElement
    const bg = currentTheme.colors.background

    // Calculate lighter/darker variants
    const adjustColor = (hex: string, amount: number) => {
      const num = parseInt(hex.replace('#', ''), 16)
      const r = Math.min(255, Math.max(0, (num >> 16) + amount))
      const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
      const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
    }

    root.style.setProperty('--bg-terminal', bg)
    root.style.setProperty('--bg-tabbar', adjustColor(bg, 15))
    root.style.setProperty('--bg-tab-active', bg)
    root.style.setProperty('--bg-tab-hover', adjustColor(bg, 25))
    root.style.setProperty('--text-primary', currentTheme.colors.foreground)

    // Also set body background for corner consistency
    document.body.style.backgroundColor = bg
  }, [currentTheme])

  return { currentTheme }
}
