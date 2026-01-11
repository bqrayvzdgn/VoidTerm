import { v4 as uuidv4 } from 'uuid'
import type { Pane } from '../types'

/**
 * Pane agacindan tum terminal ID'lerini toplar
 * @param pane - Taranacak pane agaci
 * @returns Terminal ID dizisi
 */
export function collectTerminalIds(pane: Pane): string[] {
  if (pane.type === 'terminal' && pane.terminalId) {
    return [pane.terminalId]
  }
  if (pane.children) {
    return pane.children.flatMap(collectTerminalIds)
  }
  return []
}

/** Pane pozisyon bilgisi - navigasyon icin kullanilir */
export interface PanePosition {
  terminalId: string
  /** Yatay pozisyon (0-1 arasi) */
  x: number
  /** Dikey pozisyon (0-1 arasi) */
  y: number
}

/**
 * Tum pane'lerin pozisyonlarini toplar (navigasyon icin)
 * @param pane - Taranacak pane agaci
 * @param x - Baslangic X pozisyonu
 * @param y - Baslangic Y pozisyonu
 * @param width - Genislik (0-1)
 * @param height - Yukseklik (0-1)
 * @returns Pane pozisyonlari dizisi
 */
export function collectPanePositions(
  pane: Pane,
  x = 0,
  y = 0,
  width = 1,
  height = 1
): PanePosition[] {
  if (pane.type === 'terminal' && pane.terminalId) {
    return [{
      terminalId: pane.terminalId,
      x: x + width / 2,
      y: y + height / 2
    }]
  }

  if (pane.type === 'split' && pane.children && pane.children.length >= 2) {
    const ratio = pane.ratio || 0.5
    const [first, second] = pane.children

    if (pane.direction === 'vertical') {
      return [
        ...collectPanePositions(first, x, y, width * ratio, height),
        ...collectPanePositions(second, x + width * ratio, y, width * (1 - ratio), height)
      ]
    } else {
      return [
        ...collectPanePositions(first, x, y, width, height * ratio),
        ...collectPanePositions(second, x, y + height * ratio, width, height * (1 - ratio))
      ]
    }
  }

  return []
}

/**
 * Belirtilen yonde bir sonraki terminal'i bulur
 * @param pane - Pane agaci
 * @param currentTerminalId - Mevcut terminal ID
 * @param direction - Navigasyon yonu
 * @returns Bulunan terminal ID veya null
 */
export function findNextPane(
  pane: Pane,
  currentTerminalId: string,
  direction: 'up' | 'down' | 'left' | 'right'
): string | null {
  const positions = collectPanePositions(pane)
  const current = positions.find(p => p.terminalId === currentTerminalId)
  
  if (!current || positions.length <= 1) return null

  const candidates = positions.filter(p => p.terminalId !== currentTerminalId)
  
  let best: PanePosition | null = null
  let bestScore = Infinity

  for (const candidate of candidates) {
    let isValid = false
    let score = 0

    switch (direction) {
      case 'left':
        isValid = candidate.x < current.x
        score = (current.x - candidate.x) + Math.abs(current.y - candidate.y) * 2
        break
      case 'right':
        isValid = candidate.x > current.x
        score = (candidate.x - current.x) + Math.abs(current.y - candidate.y) * 2
        break
      case 'up':
        isValid = candidate.y < current.y
        score = (current.y - candidate.y) + Math.abs(current.x - candidate.x) * 2
        break
      case 'down':
        isValid = candidate.y > current.y
        score = (candidate.y - current.y) + Math.abs(current.x - candidate.x) * 2
        break
    }

    if (isValid && score < bestScore) {
      best = candidate
      bestScore = score
    }
  }

  return best?.terminalId || null
}

/**
 * Terminal pane'i kaldirir ve agaci basitlestirir
 * @param pane - Pane agaci
 * @param targetTerminalId - Kaldirilacak terminal ID
 * @returns Guncellenmis pane veya null
 */
export function removePaneAtTerminal(pane: Pane, targetTerminalId: string): Pane | null {
  // If this is the target terminal, return null to remove it
  if (pane.type === 'terminal' && pane.terminalId === targetTerminalId) {
    return null
  }

  // If this is a split, check children
  if (pane.type === 'split' && pane.children && pane.children.length >= 2) {
    const [first, second] = pane.children
    
    const newFirst = removePaneAtTerminal(first, targetTerminalId)
    const newSecond = removePaneAtTerminal(second, targetTerminalId)

    // If first child was removed, return second
    if (newFirst === null && newSecond !== null) {
      return newSecond
    }
    
    // If second child was removed, return first
    if (newSecond === null && newFirst !== null) {
      return newFirst
    }
    
    // If both still exist but were modified
    if (newFirst !== null && newSecond !== null) {
      if (newFirst !== first || newSecond !== second) {
        return { ...pane, children: [newFirst, newSecond] }
      }
    }
    
    // If both were removed (shouldn't happen normally)
    if (newFirst === null && newSecond === null) {
      return null
    }
  }

  return pane
}

/**
 * Terminal pane'i boler ve yeni terminal ekler
 * @param pane - Pane agaci
 * @param targetTerminalId - Bolunecek terminal ID
 * @param direction - Bolme yonu
 * @param newTerminalId - Yeni terminal ID
 * @returns Guncellenmis pane veya null
 */
export function splitPaneAtTerminal(
  pane: Pane,
  targetTerminalId: string,
  direction: 'horizontal' | 'vertical',
  newTerminalId: string
): Pane | null {
  if (pane.type === 'terminal' && pane.terminalId === targetTerminalId) {
    return {
      id: uuidv4(),
      type: 'split',
      direction,
      ratio: 0.5,
      children: [
        { ...pane },
        {
          id: uuidv4(),
          type: 'terminal',
          terminalId: newTerminalId
        }
      ]
    }
  }

  if (pane.children) {
    const newChildren = pane.children.map(child => {
      const result = splitPaneAtTerminal(child, targetTerminalId, direction, newTerminalId)
      return result || child
    })

    const wasModified = newChildren.some((child, i) => child !== pane.children![i])
    if (wasModified) {
      return { ...pane, children: newChildren }
    }
  }

  return null
}
