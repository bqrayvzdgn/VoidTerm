# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VoidTerm is a cross-platform terminal emulator built with Electron 28, React 18, and xterm.js. It uses node-pty for shell process management and Zustand for state management. Requires Node.js 18+.

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
npm run test             # Run unit tests with Vitest
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run E2E tests with Playwright
```

Run a single test file: `npx vitest run src/utils/__tests__/validation.test.ts`
Run a single test in watch mode: `npx vitest src/utils/__tests__/validation.test.ts`

Platform builds: `npm run build:win`, `build:mac`, `build:linux`.

## CI Pipeline

CI runs on every push/PR to `main` in this order (each stage depends on the previous):
1. **Lint** → 2. **Typecheck** → 3. **Test** → 4. **Build** (matrix: ubuntu/windows/macos) → 5. **E2E** (Playwright with xvfb on ubuntu)

CI build step runs `build:electron && vite build` only (no `electron-builder` packaging). Full packaging only happens locally or in release workflows.

## Architecture

### Two-Process Model

- **Main process** (`electron/`): Node.js runtime. Manages windows, PTY processes, config persistence, auto-updates. Compiled to CommonJS in `dist/electron/`.
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

Seven stores in `src/store/`:
- **terminalStore**: Tabs, panes, terminal instances, broadcast mode
- **settingsStore**: User settings, profiles, theme (syncs with electron-store on disk)
- **workspaceStore**: Workspace management
- **activePaneStore**: Active pane tracking — uses `useSyncExternalStore` (not Zustand) to avoid re-rendering the entire App tree on pane focus change. Use `useActivePaneId()` in components that need it; `getActivePaneId()` / `setActivePaneId()` for imperative access.
- **customThemeStore** / **snippetStore** / **toastStore**: Feature-specific state

Zustand stores use `useShallow()` selectors to minimize re-renders. Settings changes sync bidirectionally with `electron-store` via IPC.

### Hooks Composition

`src/hooks/useTerminalManager.ts` is the orchestrator — it composes three hooks: `useTerminalLifecycle`, `usePaneOperations`, and `useTabOperations`. This is the primary hook consumed by `App.tsx`.

Other hooks (not composed by useTerminalManager): `useKeyboardShortcuts`, `useMenuEvents` (receives IPC events from main process menu actions), `useSessionManager` (save/restore tabs on close/open), `useThemeManager`, `useWindowState`, `useSearchHistory`.

### Error Boundaries

Three error boundary types provide granular error isolation:
- **ErrorBoundary**: Top-level catch-all
- **PanelErrorBoundary**: Wraps non-critical panels (TabBar, Sidebar, Settings, CommandPalette, SnippetManager) with per-panel reset callbacks
- **TerminalErrorBoundary**: Wraps the active terminal split pane area

### Session Save/Restore

On window close, `useSessionManager` saves the current tab list and active tab/workspace to config. On next launch, if saved tabs exist, a `SessionRestoreDialog` offers to reopen them. The session is persisted via `window.electronAPI.config` (backed by `electron-store`).

### Terminal Rendering

`src/components/Terminal/TerminalView.tsx` manages xterm.js instances with addons (WebGL, Fit, Search, WebLinks, Ligatures, Image, Serialize, Clipboard). A global `Map<id, Terminal>` in `src/utils/terminalRegistry.ts` tracks all live xterm instances.

### Styling

Modular plain CSS (no Tailwind, no CSS modules). Files organized under `src/styles/`:
- `base/` — CSS custom properties (`variables.css`), browser reset, layout foundations
- `components/` — Per-component stylesheets (tabbar, terminal, settings, search, etc.)
- `index.css` — Master import file that loads fonts, base, then components in order

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

## Testing

- **Framework**: Vitest with jsdom environment, `globals: true` — `describe`, `it`, `expect`, `vi` are available without imports
- **Setup**: `src/test/setup.ts` provides comprehensive `window.electronAPI` mocks — new tests can rely on this
- **Path alias**: `@/*` maps to `src/*` in both app and test code (configured in `vitest.config.ts`)
- **Test locations**: Colocated `__tests__/` directories (e.g., `src/utils/__tests__/`, `src/store/__tests__/`, `electron/__tests__/`)
- **Coverage**: V8 provider covering `src/utils/`, `src/store/`, `electron/`
- **E2E**: Playwright configured in `playwright.config.ts`, runs with xvfb in CI

## Key Conventions

- Conventional Commits for commit messages (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `perf:`)
- ESLint uses flat config format (`eslint.config.js`), with separate rule sets for `src/` and `electron/`
- **Renderer**: `no-console` ESLint rule (only `warn`/`error` allowed) — use `src/utils/logger.ts`
- **Electron**: `no-console: 'off'` because `electron-log` wraps console — use `electron/logger.ts`
- `@typescript-eslint/no-explicit-any: 'error'` — avoid `any` types
- `@typescript-eslint/consistent-type-imports: 'warn'` — use `import type` where possible
- `eqeqeq: ['error', 'always']` — strict equality required
- Prettier (inline in package.json): no semicolons, single quotes, no trailing commas, 120-char line width
- Lazy loading for heavy modals (Settings, CommandPalette, SnippetManager, UpdateDialog) via `React.lazy()` — conditionally rendered with `{isOpen && <Suspense>}`
- DEV-only `PerfMonitor` component renders when `import.meta.env.DEV` is true
- i18n strings in `src/i18n/locales/` (English and Turkish)
- 14 built-in themes defined in `src/themes/index.ts`, default is `catppuccin-mocha`
- Window: frameless (`frame: false`), Mica material on Windows 11, `titleBarStyle: 'hiddenInset'` on macOS
