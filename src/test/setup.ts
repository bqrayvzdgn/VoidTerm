import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../types'

// Default mock profiles
const defaultMockProfiles = [
  { id: 'default', name: 'Default', shell: 'cmd.exe' },
  { id: 'powershell', name: 'PowerShell', shell: 'powershell.exe' }
]

// Mock window.electronAPI for tests
const mockElectronAPI = {
  ptyCreate: vi.fn(),
  ptyWrite: vi.fn(),
  ptyResize: vi.fn(),
  ptyKill: vi.fn(),
  onPtyData: vi.fn(() => () => {}),
  onPtyExit: vi.fn(() => () => {}),
  configGet: vi.fn(),
  configSet: vi.fn(),
  configUpdate: vi.fn(),
  windowMinimize: vi.fn(),
  windowMaximize: vi.fn(),
  windowClose: vi.fn(),
  onWindowMaximized: vi.fn(() => () => {}),
  versions: {
    electron: '28.0.0',
    node: '20.0.0',
    chrome: '120.0.0'
  },
  config: {
    getSettings: vi.fn(() => Promise.resolve(DEFAULT_SETTINGS)),
    getProfiles: vi.fn(() => Promise.resolve(defaultMockProfiles)),
    updateSettings: vi.fn((updates) => Promise.resolve({ ...DEFAULT_SETTINGS, ...updates })),
    resetSettings: vi.fn(() => Promise.resolve(DEFAULT_SETTINGS)),
    addProfile: vi.fn((profile) => Promise.resolve([...defaultMockProfiles, profile])),
    updateProfile: vi.fn((id, updates) => Promise.resolve(
      defaultMockProfiles.map(p => p.id === id ? { ...p, ...updates } : p)
    )),
    removeProfile: vi.fn((id) => Promise.resolve(
      defaultMockProfiles.filter(p => p.id !== id)
    ))
  }
}

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

// Mock crypto.randomUUID
Object.defineProperty(crypto, 'randomUUID', {
  value: () => Math.random().toString(36).substring(2) + Date.now().toString(36),
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})
