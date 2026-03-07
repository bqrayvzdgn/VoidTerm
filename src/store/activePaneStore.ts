import { useSyncExternalStore } from 'react'

let _activePaneId: string | null = null
const _listeners = new Set<() => void>()

export function getActivePaneId(): string | null {
  return _activePaneId
}

export function setActivePaneId(id: string | null) {
  if (_activePaneId === id) return
  _activePaneId = id
  _listeners.forEach((l) => l())
}

export function subscribeActivePaneId(listener: () => void) {
  _listeners.add(listener)
  return () => {
    _listeners.delete(listener)
  }
}

export function useActivePaneId(): string | null {
  return useSyncExternalStore(subscribeActivePaneId, getActivePaneId)
}
