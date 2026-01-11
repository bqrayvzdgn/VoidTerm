import { describe, it, expect } from 'vitest'
import type { Pane } from '../types'
import {
  collectTerminalIds,
  collectPanePositions,
  findNextPane,
  removePaneAtTerminal,
  splitPaneAtTerminal
} from './pane'

describe('pane utilities', () => {
  // Test fixtures
  const singleTerminal: Pane = {
    id: 'pane-1',
    type: 'terminal',
    terminalId: 'term-1'
  }

  const horizontalSplit: Pane = {
    id: 'split-1',
    type: 'split',
    direction: 'horizontal',
    ratio: 0.5,
    children: [
      { id: 'pane-1', type: 'terminal', terminalId: 'term-1' },
      { id: 'pane-2', type: 'terminal', terminalId: 'term-2' }
    ]
  }

  const verticalSplit: Pane = {
    id: 'split-1',
    type: 'split',
    direction: 'vertical',
    ratio: 0.5,
    children: [
      { id: 'pane-1', type: 'terminal', terminalId: 'term-1' },
      { id: 'pane-2', type: 'terminal', terminalId: 'term-2' }
    ]
  }

  const nestedSplit: Pane = {
    id: 'split-root',
    type: 'split',
    direction: 'vertical',
    ratio: 0.5,
    children: [
      { id: 'pane-1', type: 'terminal', terminalId: 'term-1' },
      {
        id: 'split-nested',
        type: 'split',
        direction: 'horizontal',
        ratio: 0.5,
        children: [
          { id: 'pane-2', type: 'terminal', terminalId: 'term-2' },
          { id: 'pane-3', type: 'terminal', terminalId: 'term-3' }
        ]
      }
    ]
  }

  describe('collectTerminalIds', () => {
    it('should return single terminal ID for terminal pane', () => {
      const ids = collectTerminalIds(singleTerminal)
      expect(ids).toEqual(['term-1'])
    })

    it('should return all terminal IDs for horizontal split', () => {
      const ids = collectTerminalIds(horizontalSplit)
      expect(ids).toEqual(['term-1', 'term-2'])
    })

    it('should return all terminal IDs for vertical split', () => {
      const ids = collectTerminalIds(verticalSplit)
      expect(ids).toEqual(['term-1', 'term-2'])
    })

    it('should return all terminal IDs for nested splits', () => {
      const ids = collectTerminalIds(nestedSplit)
      expect(ids).toEqual(['term-1', 'term-2', 'term-3'])
    })

    it('should return empty array for terminal pane without terminalId', () => {
      const pane: Pane = { id: 'pane-1', type: 'terminal' }
      const ids = collectTerminalIds(pane)
      expect(ids).toEqual([])
    })

    it('should return empty array for split pane without children', () => {
      const pane: Pane = { id: 'split-1', type: 'split', direction: 'horizontal' }
      const ids = collectTerminalIds(pane)
      expect(ids).toEqual([])
    })
  })

  describe('collectPanePositions', () => {
    it('should return center position for single terminal', () => {
      const positions = collectPanePositions(singleTerminal)
      expect(positions).toHaveLength(1)
      expect(positions[0]).toEqual({ terminalId: 'term-1', x: 0.5, y: 0.5 })
    })

    it('should return correct positions for horizontal split', () => {
      const positions = collectPanePositions(horizontalSplit)
      expect(positions).toHaveLength(2)
      // Horizontal split = top/bottom
      expect(positions[0]).toEqual({ terminalId: 'term-1', x: 0.5, y: 0.25 })
      expect(positions[1]).toEqual({ terminalId: 'term-2', x: 0.5, y: 0.75 })
    })

    it('should return correct positions for vertical split', () => {
      const positions = collectPanePositions(verticalSplit)
      expect(positions).toHaveLength(2)
      // Vertical split = left/right
      expect(positions[0]).toEqual({ terminalId: 'term-1', x: 0.25, y: 0.5 })
      expect(positions[1]).toEqual({ terminalId: 'term-2', x: 0.75, y: 0.5 })
    })

    it('should return correct positions for nested splits', () => {
      const positions = collectPanePositions(nestedSplit)
      expect(positions).toHaveLength(3)
      // term-1 is on the left half
      expect(positions[0].terminalId).toBe('term-1')
      expect(positions[0].x).toBe(0.25)
      // term-2 and term-3 are on the right half, stacked vertically
      expect(positions[1].terminalId).toBe('term-2')
      expect(positions[2].terminalId).toBe('term-3')
    })
  })

  describe('findNextPane', () => {
    it('should return null for single terminal', () => {
      expect(findNextPane(singleTerminal, 'term-1', 'left')).toBeNull()
      expect(findNextPane(singleTerminal, 'term-1', 'right')).toBeNull()
      expect(findNextPane(singleTerminal, 'term-1', 'up')).toBeNull()
      expect(findNextPane(singleTerminal, 'term-1', 'down')).toBeNull()
    })

    it('should find pane to the right in vertical split', () => {
      const result = findNextPane(verticalSplit, 'term-1', 'right')
      expect(result).toBe('term-2')
    })

    it('should find pane to the left in vertical split', () => {
      const result = findNextPane(verticalSplit, 'term-2', 'left')
      expect(result).toBe('term-1')
    })

    it('should find pane below in horizontal split', () => {
      const result = findNextPane(horizontalSplit, 'term-1', 'down')
      expect(result).toBe('term-2')
    })

    it('should find pane above in horizontal split', () => {
      const result = findNextPane(horizontalSplit, 'term-2', 'up')
      expect(result).toBe('term-1')
    })

    it('should return null when no pane in that direction', () => {
      expect(findNextPane(verticalSplit, 'term-1', 'left')).toBeNull()
      expect(findNextPane(verticalSplit, 'term-2', 'right')).toBeNull()
      expect(findNextPane(horizontalSplit, 'term-1', 'up')).toBeNull()
      expect(findNextPane(horizontalSplit, 'term-2', 'down')).toBeNull()
    })

    it('should return null for non-existent terminal', () => {
      expect(findNextPane(verticalSplit, 'non-existent', 'right')).toBeNull()
    })
  })

  describe('removePaneAtTerminal', () => {
    it('should return null when removing single terminal', () => {
      const result = removePaneAtTerminal(singleTerminal, 'term-1')
      expect(result).toBeNull()
    })

    it('should return sibling when removing from split', () => {
      const result = removePaneAtTerminal(horizontalSplit, 'term-1')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('terminal')
      expect(result?.terminalId).toBe('term-2')
    })

    it('should return first sibling when removing second from split', () => {
      const result = removePaneAtTerminal(horizontalSplit, 'term-2')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('terminal')
      expect(result?.terminalId).toBe('term-1')
    })

    it('should simplify nested split when removing terminal', () => {
      const result = removePaneAtTerminal(nestedSplit, 'term-1')
      expect(result).not.toBeNull()
      // Should return the nested split
      expect(result?.type).toBe('split')
      expect(result?.direction).toBe('horizontal')
    })

    it('should return original pane when terminal not found', () => {
      const result = removePaneAtTerminal(horizontalSplit, 'non-existent')
      expect(result).toBe(horizontalSplit)
    })
  })

  describe('splitPaneAtTerminal', () => {
    it('should split single terminal vertically', () => {
      const result = splitPaneAtTerminal(singleTerminal, 'term-1', 'vertical', 'term-new')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('split')
      expect(result?.direction).toBe('vertical')
      expect(result?.children).toHaveLength(2)
      expect(result?.children?.[0].terminalId).toBe('term-1')
      expect(result?.children?.[1].terminalId).toBe('term-new')
    })

    it('should split single terminal horizontally', () => {
      const result = splitPaneAtTerminal(singleTerminal, 'term-1', 'horizontal', 'term-new')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('split')
      expect(result?.direction).toBe('horizontal')
      expect(result?.children).toHaveLength(2)
    })

    it('should split terminal in nested structure', () => {
      const result = splitPaneAtTerminal(horizontalSplit, 'term-2', 'vertical', 'term-new')
      expect(result).not.toBeNull()
      expect(result?.type).toBe('split')
      expect(result?.children?.[1].type).toBe('split')
      expect(result?.children?.[1].direction).toBe('vertical')
    })

    it('should return null when terminal not found', () => {
      const result = splitPaneAtTerminal(singleTerminal, 'non-existent', 'vertical', 'term-new')
      expect(result).toBeNull()
    })

    it('should set ratio to 0.5 by default', () => {
      const result = splitPaneAtTerminal(singleTerminal, 'term-1', 'vertical', 'term-new')
      expect(result?.ratio).toBe(0.5)
    })
  })
})
