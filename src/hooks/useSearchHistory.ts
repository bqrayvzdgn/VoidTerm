import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'voidterm-search-history'
const MAX_HISTORY_SIZE = 20

/**
 * Terminal arama geçmişini yöneten hook.
 * localStorage'da kalıcı olarak saklar.
 */
export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // localStorage'dan geçmişi yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, MAX_HISTORY_SIZE))
        }
      }
    } catch (e) {
      console.warn('Failed to load search history:', e)
    }
  }, [])

  // Geçmişi localStorage'a kaydet
  const saveHistory = useCallback((newHistory: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
    } catch (e) {
      console.warn('Failed to save search history:', e)
    }
  }, [])

  /**
   * Aramayı geçmişe ekle
   */
  const addToHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return

    setHistory(prev => {
      // Eğer zaten varsa, en üste taşı
      const filtered = prev.filter(item => item !== searchTerm)
      const newHistory = [searchTerm, ...filtered].slice(0, MAX_HISTORY_SIZE)
      saveHistory(newHistory)
      return newHistory
    })
    setHistoryIndex(-1)
  }, [saveHistory])

  /**
   * Geçmişte bir önceki aramaya git
   */
  const navigatePrevious = useCallback((): string | null => {
    if (history.length === 0) return null
    
    const newIndex = historyIndex + 1
    if (newIndex < history.length) {
      setHistoryIndex(newIndex)
      return history[newIndex]
    }
    return null
  }, [history, historyIndex])

  /**
   * Geçmişte bir sonraki aramaya git
   */
  const navigateNext = useCallback((): string | null => {
    if (historyIndex <= 0) {
      setHistoryIndex(-1)
      return ''
    }
    
    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)
    return history[newIndex]
  }, [history, historyIndex])

  /**
   * Geçmiş index'ini sıfırla
   */
  const resetIndex = useCallback(() => {
    setHistoryIndex(-1)
  }, [])

  /**
   * Geçmişi temizle
   */
  const clearHistory = useCallback(() => {
    setHistory([])
    setHistoryIndex(-1)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  /**
   * Geçmişten bir öğeyi sil
   */
  const removeFromHistory = useCallback((searchTerm: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item !== searchTerm)
      saveHistory(newHistory)
      return newHistory
    })
  }, [saveHistory])

  return {
    history,
    historyIndex,
    addToHistory,
    navigatePrevious,
    navigateNext,
    resetIndex,
    clearHistory,
    removeFromHistory
  }
}
