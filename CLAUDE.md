# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

Requires Node.js 18+.

```bash
# Development (runs Vite + Electron concurrently)
npm run dev

# Build for production
npm run build              # Full build (compiles TypeScript, bundles, creates installer)
npm run build:win          # Windows build
npm run build:mac          # macOS build
npm run build:linux        # Linux build

# Build electron main process only
npm run build:electron     # Compiles electron/*.ts to dist/electron/

# Generate app icons from assets/source-icon.png
npm run generate-icons
```

## Testing

```bash
# Unit tests (Vitest + jsdom)
npm run test               # Run all tests once
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report

# Single file test
npx vitest run path/to/file.test.ts

# Pattern matching
npx vitest run -t "test name pattern"

# E2E tests (Playwright + Electron)
npm run test:e2e           # Headless
npm run test:e2e:headed    # With visible browser
```

Test files use `.test.ts` or `.test.tsx` extension. E2E tests are in `e2e/` directory.

## Architecture Overview

VoidTerm is an Electron-based terminal emulator built with React, xterm.js, and node-pty.

### Process Separation

**Main Process** (`electron/`)
- `main.ts` - Window creation, menu setup, IPC handlers for PTY and config operations
- `pty-manager.ts` - Manages pseudo-terminal processes via node-pty. Each terminal gets a UUID, supports create/write/resize/kill operations
- `config-manager.ts` - Persistent configuration using electron-store. Manages settings, profiles, and workspaces in JSON format
- `preload.ts` - Exposes `window.electronAPI` to renderer with PTY, window control, and config methods

**Renderer Process** (`src/`)
- React app using Vite for bundling
- xterm.js with WebGL addon for terminal rendering
- Path alias: `@/*` maps to `src/*`

### State Management (Zustand stores in `src/store/`)

- `terminalStore.ts` - Tabs, panes, tab groups, and terminal state. Panes form a tree structure supporting recursive horizontal/vertical splits. Includes closed tab history for reopen functionality
- `settingsStore.ts` - Settings and shell profiles loaded from electron-store config
- `workspaceStore.ts` - Workspace management (groups of tabs) loaded from electron-store config
- `snippetStore.ts` - Command snippets with usage tracking and optional keyboard shortcuts
- `customThemeStore.ts` - User-defined custom terminal themes
- `toastStore.ts` - Toast notification queue management

### Configuration Storage

Configuration is stored using electron-store in platform-specific locations:
- Windows: `%APPDATA%/voidterm/config.json`
- macOS: `~/Library/Application Support/voidterm/config.json`
- Linux: `~/.config/voidterm/config.json`

The config file contains settings, profiles, and workspaces in human-readable JSON format.

### IPC Communication Pattern

Renderer creates terminals via `window.electronAPI.ptyCreate()`, receives data via `onPtyData` listener. The PTY ID (UUID) maps terminal instances to their underlying processes.

### Logging

Uses `electron-log` for structured logging in the main process (`electron/logger.ts`) and a custom logger utility in the renderer (`src/utils/logger.ts`).

### Key Types (`src/types/index.ts`)

- `Pane` - Tree node with `type: 'terminal' | 'split'`, `direction`, `children`, and `ratio` for split proportions
- `Profile` - Shell configuration (shell path, args, working directory, environment, startup command)
- `Theme` - 16-color terminal theme with cursor and selection colors
- `SSHConnection` - SSH connection config (host, port, auth method, optional jump host for tunneling)
- `Snippet` - Saved command with name, description, category, and optional shortcut
- `TabGroup` - Tab grouping with name, color, and collapse state

### Themes

Defined in `src/themes/index.ts`. 11 built-in themes: catppuccin-mocha (default), dracula, one-dark, tokyo-night, nord, github-dark, windows-terminal, gruvbox-dark, solarized-dark, monokai, material. Users can also create custom themes stored in `customThemeStore`.

### Internationalization (`src/i18n/`)

Simple Zustand-based i18n with Turkish (`tr`) and English (`en`) locales. Language preference is stored in localStorage. Use the `useTranslation` hook to access translations.

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` code refactoring
- `test:` tests
- `chore:` maintenance

## Code Style

### Import Order

1. React and core library imports
2. Third-party libraries (xterm, uuid, zustand)
3. Internal imports with `@/` alias
4. Type imports with `import type { ... }`
5. CSS imports last

```typescript
import React, { useEffect, useState, useCallback } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { TabBar } from '@/components/TabBar/TabBar'
import { useTerminalStore } from '@/store/terminalStore'
import type { Tab, Pane } from '@/types'
import '@/styles/main.css'
```

### Naming Conventions

| Category | Convention | Example |
|----------|------------|---------|
| Components | PascalCase in folder | `TabBar/TabBar.tsx` |
| Hooks | `use` prefix | `useTerminalManager.ts` |
| Stores | `Store` suffix | `terminalStore.ts` |
| Event handlers | `handle` prefix | `handleCloseTab` |
| Callback props | `on` prefix | `onNewTab`, `onCloseTab` |
| Boolean | `is` prefix | `isMaximized`, `isActive` |
| CSS classes | kebab-case | `app-container` |

### React Patterns

- Functional components + hooks
- `useCallback` for handlers passed to children
- `useMemo` for expensive computations
- `useShallow` with Zustand selectors to prevent unnecessary rerenders
- `forwardRef` + `useImperativeHandle` to expose methods

## Keyboard Shortcuts

### Tab/Pane Management
- `Ctrl+T` / `Cmd+T` - New tab
- `Ctrl+W` / `Cmd+W` - Close tab
- `Ctrl+Shift+T` - Reopen closed tab
- `Ctrl+Shift+W` - Close pane
- `Ctrl+Tab` - Next tab
- `Ctrl+Shift+Tab` - Previous tab
- `Ctrl+Shift+D` - Split vertical
- `Ctrl+Shift+E` - Split horizontal
- `Ctrl+Shift+M` - Maximize/minimize pane
- `Ctrl+Alt+Arrow` - Focus pane in direction

### Terminal
- `Ctrl+Shift+C` - Copy
- `Ctrl+Shift+V` - Paste
- `Ctrl+F` - Toggle search
- `Ctrl+L` - Clear terminal
- `Ctrl++` / `Ctrl+=` - Zoom in
- `Ctrl+-` - Zoom out
- `Ctrl+0` - Reset zoom

### Application
- `Ctrl+,` / `Cmd+,` - Settings
- `Ctrl+Shift+P` - Command palette
- `Ctrl+Shift+S` - SSH manager
- `Ctrl+Shift+B` - Toggle workspace sidebar

Shortcuts are customizable via settings and stored in `Settings.shortcuts`.
