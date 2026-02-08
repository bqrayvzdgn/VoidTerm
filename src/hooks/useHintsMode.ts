import { useState, useCallback, useEffect, useMemo } from 'react'
import type { Terminal } from '@xterm/xterm'
import { terminalLogger } from '../utils/logger'

export interface HintMatch {
  text: string
  label: string
  x: number
  y: number
}

/**
 * Patterns to detect in the terminal viewport for quick-select hints.
 */
const HINT_PATTERNS = [
  // URLs
  /https?:\/\/[^\s'")\]>]+/g,
  // File paths (Unix and Windows)
  /(?:\/[\w.-]+){2,}/g,
  /[A-Z]:\\[\w.\\-]+/g,
  // IP addresses
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\b/g,
  // Git hashes (7+ hex chars)
  /\b[0-9a-f]{7,40}\b/g,
  // Quoted strings
  /(?<=['"])([^'"]{2,})(?=['"])/g,
  // UUIDs
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
]

/**
 * Generate hint labels: a, s, d, f, j, k, l, then two-letter combos
 */
function generateLabels(count: number): string[] {
  const chars = 'asdfghjkl'
  const labels: string[] = []

  // Single-character labels first
  for (const c of chars) {
    if (labels.length >= count) break
    labels.push(c)
  }

  // Two-character labels if needed
  for (const c1 of chars) {
    for (const c2 of chars) {
      if (labels.length >= count) break
      labels.push(c1 + c2)
    }
    if (labels.length >= count) break
  }

  return labels.slice(0, count)
}

/**
 * Hook for hints/quick-select mode.
 * Scans the terminal viewport for interesting patterns and overlays
 * letter labels that allow quick copying.
 */
export function useHintsMode(terminal: Terminal | null) {
  const [active, setActive] = useState(false)
  const [hints, setHints] = useState<HintMatch[]>([])
  const [inputBuffer, setInputBuffer] = useState('')

  const scanViewport = useCallback(() => {
    if (!terminal) return []

    const buffer = terminal.buffer.active
    const viewportY = buffer.viewportY
    const matches: Array<{ text: string; x: number; y: number }> = []
    const seen = new Set<string>()

    for (let row = 0; row < terminal.rows; row++) {
      const bufferLine = buffer.getLine(viewportY + row)
      if (!bufferLine) continue

      const lineText = bufferLine.translateToString(true)

      for (const pattern of HINT_PATTERNS) {
        pattern.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = pattern.exec(lineText)) !== null) {
          const text = match[0]
          const key = `${text}:${viewportY + row}:${match.index}`
          if (seen.has(key) || text.length < 3) continue
          seen.add(key)

          matches.push({
            text,
            x: match.index,
            y: row
          })
        }
      }
    }

    return matches
  }, [terminal])

  const activate = useCallback(() => {
    const matches = scanViewport()
    const labels = generateLabels(matches.length)
    const hintMatches: HintMatch[] = matches.map((m, i) => ({
      ...m,
      label: labels[i]
    }))

    setHints(hintMatches)
    setInputBuffer('')
    setActive(true)
  }, [scanViewport])

  const deactivate = useCallback(() => {
    setActive(false)
    setHints([])
    setInputBuffer('')
  }, [])

  const toggle = useCallback(() => {
    if (active) {
      deactivate()
    } else {
      activate()
    }
  }, [active, activate, deactivate])

  // Filter hints based on current input
  const filteredHints = useMemo(() => {
    if (!inputBuffer) return hints
    return hints.filter(h => h.label.startsWith(inputBuffer))
  }, [hints, inputBuffer])

  // Handle keyboard input in hints mode
  useEffect(() => {
    if (!active) return

    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') {
        deactivate()
        return
      }

      if (e.key === 'Backspace') {
        setInputBuffer(prev => prev.slice(0, -1))
        return
      }

      if (e.key.length === 1 && /[a-z]/.test(e.key)) {
        const newInput = inputBuffer + e.key

        // Check for exact match
        const exactMatch = hints.find(h => h.label === newInput)
        if (exactMatch) {
          navigator.clipboard.writeText(exactMatch.text).catch((error) => {
            terminalLogger.warn('Failed to copy hint text:', error)
          })
          deactivate()
          return
        }

        // Check if any hints still match the prefix
        const hasPrefix = hints.some(h => h.label.startsWith(newInput))
        if (hasPrefix) {
          setInputBuffer(newInput)
        } else {
          deactivate()
        }
      }
    }

    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [active, hints, inputBuffer, deactivate])

  return {
    active,
    hints: filteredHints,
    inputBuffer,
    toggle,
    activate,
    deactivate
  }
}
