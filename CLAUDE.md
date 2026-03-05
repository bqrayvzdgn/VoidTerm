# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VoidTerm is a cross-platform terminal emulator built with Electron 28, React 18, and xterm.js. It uses node-pty for shell process management and Zustand for state management.

## Commands

```bash
npm run dev              # Start dev (Vite on :5173 + Electron concurrently)
npm run build            # Full production build (TS compile + Vite + electron-builder)
npm run build:electron   # Compile only the Electron main process (npx tsc -p electron/tsconfig.json)
npm run lint             # ESLint on src/ and electron/
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier write
npm run format:check     # Prettier check (CI)
npm run typecheck        # Type-check both renderer and electron tsconfigs
```

Platform builds: `npm run build:win`, `build:mac`, `build:linux`.

No test framework is currently configured in the repo.

## Architecture

### Two-Process Model

- **Main process** (`electron/`): Node.js runtime. Manages windows, PTY processes, config persistence, auto-updates, tray, deep links. Compiled to CommonJS in `dist/electron/`.
- **Renderer process** (`src/`): React app bundled by Vite to `dist/renderer/`. Uses xterm.js with WebGL addon for terminal rendering.
- **IPC bridge** (`electron/preload.ts`): `contextBridge` exposes `window.electronAPI` — the only communication channel between processes. Context isolation and sandbox are enforced.

### IPC Patterns

Three IPC patterns are used throughout:
- **Invoke** (promise-based): `window.electronAPI.ptyCreate()` → `ipcMain.handle('pty-create')`
- **Send** (fire-and-forget): `window.electronAPI.ptyWrite(id, data)` → `ipcMain.on('pty-write')`
- **On** (main→renderer events): `window.electronAPI.onPtyData(cb)` ← `webContents.send('pty-data')`

The full typed API surface is defined in `src/types/electron.d.ts`. The preload also exposes nested objects: `window.electronAPI.config` (settings/profile/workspace/SSH CRUD, backup/restore, import/export) and `window.electronAPI.updates` (auto-update lifecycle).

### PTY Management

`electron/pty-manager.ts` wraps node-pty with an environment variable whitelist (only safe vars forwarded to child shells) and IPC event forwarding. Terminal lifecycle: renderer requests create → PtyManager spawns process → data/exit events flow back via IPC.

### State Management (Zustand)

Six stores in `src/store/`:
- **terminalStore**: Tabs, panes, terminal instances, broadcast mode
- **settingsStore**: User settings, profiles, theme (syncs with electron-store on disk)
- **workspaceStore**: Workspace management
- **customThemeStore** / **snippetStore** / **toastStore**: Feature-specific state

Stores use `useShallow()` selectors to minimize re-renders. Settings changes sync bidirectionally with `electron-store` via IPC.

### Hooks Composition

`src/hooks/useTerminalManager.ts` is the orchestrator — it composes exactly four hooks: `useTerminalLifecycle`, `usePaneOperations`, `useTabOperations`, and `useBroadcastInput`. This is the primary hook consumed by `App.tsx`.

Other notable hooks (not composed by useTerminalManager): `useKeyboardShortcuts`, `useMenuEvents`, `useSessionManager`, `useThemeManager`, `useWindowState`, `useViMode`, `useSSHManager`, `useSearchHistory`.

### Terminal Rendering

`src/components/Terminal/TerminalView.tsx` manages xterm.js instances with addons (WebGL, Fit, Search, WebLinks, Ligatures, Image, Serialize, Clipboard). A global `Map<id, Terminal>` in `src/utils/terminalRegistry.ts` tracks all live xterm instances.

### Deep Links

Protocol: `voidterm://`. Registered via `app.setAsDefaultProtocolClient('voidterm')` in `electron/main.ts`. Supported actions:
- `voidterm://open?cwd=/path/to/dir` — open terminal at directory
- `voidterm://ssh?host=example.com&user=root` — start SSH session
- `voidterm://run?cmd=ls+-la` — run command (requires user confirmation)

Single-instance lock ensures deep links from a second instance are forwarded to the first.

### Quake Mode

Toggle with `F12` (show/hide) or `` Ctrl+` `` (toggle mode). Quake window: top of screen, full width, 40% height, always-on-top.

### Config Persistence

`electron/config-manager.ts` uses `electron-store` with typed `AppConfig` schema (settings, profiles, workspaces, sshConnections, session). Backup system stores up to 5 snapshots as `config.backup.<timestamp>.json` alongside the main config file. Import validation rejects shell metacharacters in profile `startupCommand`.

Platform-specific default profiles:
- Windows: PowerShell, Command Prompt, Git Bash, WSL
- macOS: Zsh, Bash
- Linux: Bash, Zsh, Fish

### Security Model

- Context isolation + sandbox enabled
- IPC rate limiting via token-bucket (`electron/rate-limiter.ts`)
- Environment variable whitelist for PTY processes
- Input validation/sanitization for SSH connections (`src/utils/validation.ts`)
- CSP headers: dev allows `unsafe-inline` + WebSocket to `ws://localhost:*`; production restricts to `script-src 'self'`
- `open-external` IPC validates protocol (https/http/mailto only)
- `path-join` IPC rejects `..` path-traversal segments

### Vite Build

`vite.config.ts`: `base: './'` for Electron `file://` loading. Manual chunk splitting:
- `vendor-react`: react, react-dom
- `vendor-xterm`: @xterm/xterm, addon-fit, addon-webgl, addon-search
- `vendor-zustand`: zustand

Output: `dist/renderer/`. Dev server: `localhost:5173` (strict port).

## TypeScript Configuration

- **Renderer** (`tsconfig.json`): ES2020, ESNext modules, strict mode, `@/*` path alias maps to `src/*`
- **Electron** (`electron/tsconfig.json`): ES2020, CommonJS output to `dist/electron/`

## Key Conventions

- Conventional Commits for commit messages
- **Renderer**: `no-console` ESLint rule (only `warn`/`error` allowed) — use `src/utils/logger.ts`
- **Electron**: `no-console: 'off'` because `electron-log` wraps console — use `electron/logger.ts`
- `@typescript-eslint/no-explicit-any: 'error'` — avoid `any` types
- `eqeqeq: ['error', 'always']` — strict equality required
- Prettier (inline in package.json): no semicolons, single quotes, no trailing commas, 120-char line width
- Lazy loading for heavy modals (Settings, CommandPalette, SSHManager) via `React.lazy()`
- i18n strings in `src/i18n/locales/` (English and Turkish)
- 11 built-in themes defined in `src/themes/index.ts`, default is `catppuccin-mocha`
- Window: frameless (`frame: false`), Mica material on Windows 11, `titleBarStyle: 'hiddenInset'` on macOS
