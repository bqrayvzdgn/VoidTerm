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

- `terminalStore.ts` - Tabs, panes, and terminal state. Panes form a tree structure supporting recursive horizontal/vertical splits
- `settingsStore.ts` - Settings and shell profiles loaded from electron-store config
- `workspaceStore.ts` - Workspace management (groups of tabs) loaded from electron-store config

### Configuration Storage

Configuration is stored using electron-store in platform-specific locations:
- Windows: `%APPDATA%/voidterm/config.json`
- macOS: `~/Library/Application Support/voidterm/config.json`
- Linux: `~/.config/voidterm/config.json`

The config file contains settings, profiles, and workspaces in human-readable JSON format.

### IPC Communication Pattern

Renderer creates terminals via `window.electronAPI.ptyCreate()`, receives data via `onPtyData` listener. The PTY ID (UUID) maps terminal instances to their underlying processes.

### Key Types (`src/types/index.ts`)

- `Pane` - Tree node with `type: 'terminal' | 'split'`, `direction`, `children`, and `ratio` for split proportions
- `Profile` - Shell configuration (shell path, args, working directory, environment)
- `Theme` - 16-color terminal theme with cursor and selection colors

### Themes

Defined in `src/themes/index.ts`. Available: catppuccin-mocha (default), dracula, one-dark, tokyo-night, nord, github-dark.

## Keyboard Shortcuts

- `Ctrl+T` / `Cmd+T` - New tab
- `Ctrl+W` / `Cmd+W` - Close tab
- `Ctrl+Tab` - Next tab
- `Ctrl+Shift+Tab` - Previous tab
- `Ctrl+Shift+D` - Split vertical
- `Ctrl+Shift+E` - Split horizontal
- `Ctrl+Shift+B` - Toggle workspace sidebar
- `Ctrl+,` / `Cmd+,` - Settings
