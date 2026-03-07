import { describe, it, expect } from 'vitest'
import {
  collectTerminalIds,
  collectPanePositions,
  findNextPane,
  removePaneAtTerminal,
  splitPaneAtTerminal
} from '../pane'
import type { Pane } from '../../types'

describe('collectTerminalIds', () => {
  it('returns terminalId for a terminal pane', () => {
    const pane: Pane = { id: 'p1', type: 'terminal', terminalId: 't1' }
    expect(collectTerminalIds(pane)).toEqual(['t1'])
  })

  it('returns all nested terminal IDs from a split pane', () => {
    const pane: Pane = {
      id: 'p1',
      type: 'split',
      direction: 'vertical',
      children: [
        { id: 'p2', type: 'terminal', terminalId: 't1' },
        { id: 'p3', type: 'terminal', terminalId: 't2' }
      ]
    }
    expect(collectTerminalIds(pane)).toEqual(['t1', 't2'])
  })

  it('returns empty array for split with no children', () => {
    const pane: Pane = { id: 'p1', type: 'split', direction: 'vertical' }
    expect(collectTerminalIds(pane)).toEqual([])
  })

  it('handles deeply nested panes', () => {
    const pane: Pane = {
      id: 'p1',
      type: 'split',
      direction: 'vertical',
      children: [
        { id: 'p2', type: 'terminal', terminalId: 't1' },
        {
          id: 'p3',
          type: 'split',
          direction: 'horizontal',
          children: [
            { id: 'p4', type: 'terminal', terminalId: 't2' },
            { id: 'p5', type: 'terminal', terminalId: 't3' }
          ]
        }
      ]
    }
    expect(collectTerminalIds(pane)).toEqual(['t1', 't2', 't3'])
  })

  it('returns empty array for terminal pane without terminalId', () => {
    const pane: Pane = { id: 'p1', type: 'terminal' }
    expect(collectTerminalIds(pane)).toEqual([])
  })
})

describe('collectPanePositions', () => {
  it('returns center position for a single terminal', () => {
    const pane: Pane = { id: 'p1', type: 'terminal', terminalId: 't1' }
    const positions = collectPanePositions(pane)
    expect(positions).toHaveLength(1)
    expect(positions[0].terminalId).toBe('t1')
    expect(positions[0].x).toBe(0.5)
    expect(positions[0].y).toBe(0.5)
  })

  it('returns correct positions for vertical split', () => {
    const pane: Pane = {
      id: 'p1',
      type: 'split',
      direction: 'vertical',
      ratio: 0.5,
      children: [
        { id: 'p2', type: 'terminal', terminalId: 't1' },
        { id: 'p3', type: 'terminal', terminalId: 't2' }
      ]
    }
    const positions = collectPanePositions(pane)
    expect(positions).toHaveLength(2)
    // First pane: left half, center at x=0.25
    expect(positions[0].x).toBe(0.25)
    // Second pane: right half, center at x=0.75
    expect(positions[1].x).toBe(0.75)
  })

  it('returns correct positions for horizontal split', () => {
    const pane: Pane = {
      id: 'p1',
      type: 'split',
      direction: 'horizontal',
      ratio: 0.5,
      children: [
        { id: 'p2', type: 'terminal', terminalId: 't1' },
        { id: 'p3', type: 'terminal', terminalId: 't2' }
      ]
    }
    const positions = collectPanePositions(pane)
    expect(positions).toHaveLength(2)
    // First pane: top half, center at y=0.25
    expect(positions[0].y).toBe(0.25)
    // Second pane: bottom half, center at y=0.75
    expect(positions[1].y).toBe(0.75)
  })
})

describe('findNextPane', () => {
  const splitPane: Pane = {
    id: 'p1',
    type: 'split',
    direction: 'vertical',
    ratio: 0.5,
    children: [
      { id: 'p2', type: 'terminal', terminalId: 't1' },
      { id: 'p3', type: 'terminal', terminalId: 't2' }
    ]
  }

  it('finds pane to the right', () => {
    expect(findNextPane(splitPane, 't1', 'right')).toBe('t2')
  })

  it('finds pane to the left', () => {
    expect(findNextPane(splitPane, 't2', 'left')).toBe('t1')
  })

  it('returns null when no pane in that direction', () => {
    expect(findNextPane(splitPane, 't1', 'left')).toBeNull()
    expect(findNextPane(splitPane, 't2', 'right')).toBeNull()
  })

  it('returns null for single terminal pane', () => {
    const single: Pane = { id: 'p1', type: 'terminal', terminalId: 't1' }
    expect(findNextPane(single, 't1', 'right')).toBeNull()
  })

  it('navigates up and down in horizontal split', () => {
    const hSplit: Pane = {
      id: 'p1',
      type: 'split',
      direction: 'horizontal',
      ratio: 0.5,
      children: [
        { id: 'p2', type: 'terminal', terminalId: 't1' },
        { id: 'p3', type: 'terminal', terminalId: 't2' }
      ]
    }
    expect(findNextPane(hSplit, 't1', 'down')).toBe('t2')
    expect(findNextPane(hSplit, 't2', 'up')).toBe('t1')
  })
})

describe('removePaneAtTerminal', () => {
  it('returns null when removing the only terminal', () => {
    const pane: Pane = { id: 'p1', type: 'terminal', terminalId: 't1' }
    expect(removePaneAtTerminal(pane, 't1')).toBeNull()
  })

  it('returns sibling when removing one child of a split', () => {
    const pane: Pane = {
      id: 'p1',
      type: 'split',
      direction: 'vertical',
      children: [
        { id: 'p2', type: 'terminal', terminalId: 't1' },
        { id: 'p3', type: 'terminal', terminalId: 't2' }
      ]
    }
    const result = removePaneAtTerminal(pane, 't1')
    expect(result).not.toBeNull()
    expect(result!.type).toBe('terminal')
    expect(result!.terminalId).toBe('t2')
  })

  it('returns unchanged pane when target not found', () => {
    const pane: Pane = { id: 'p1', type: 'terminal', terminalId: 't1' }
    expect(removePaneAtTerminal(pane, 'nonexistent')).toBe(pane)
  })
})

describe('splitPaneAtTerminal', () => {
  it('splits a terminal pane into a split with two children', () => {
    const pane: Pane = { id: 'p1', type: 'terminal', terminalId: 't1' }
    const result = splitPaneAtTerminal(pane, 't1', 'vertical', 't2')
    expect(result).not.toBeNull()
    expect(result!.type).toBe('split')
    expect(result!.direction).toBe('vertical')
    expect(result!.children).toHaveLength(2)
    expect(result!.children![0].terminalId).toBe('t1')
    expect(result!.children![1].terminalId).toBe('t2')
  })

  it('returns null when target terminal not found', () => {
    const pane: Pane = { id: 'p1', type: 'terminal', terminalId: 't1' }
    expect(splitPaneAtTerminal(pane, 'nonexistent', 'vertical', 't2')).toBeNull()
  })
})
