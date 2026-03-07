# Contributing to VoidTerm

Thank you for your interest in contributing to VoidTerm! This guide will help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Git](https://git-scm.com/)
- npm (comes with Node.js)

## Development Setup

```bash
# Clone the repository
git clone https://github.com/bqrayvzdgn/VoidTerm.git
cd VoidTerm

# Install dependencies
npm install

# Start development server
npm run dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server + Electron |
| `npm run build` | Full production build |
| `npm run build:electron` | Compile Electron main process only |
| `npm run lint` | Run ESLint on src/ and electron/ |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting (CI) |
| `npm run typecheck` | Type-check both renderer and electron |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow this format:

```
<type>: <description>
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code restructuring without behavior change
- `test:` - Adding or updating tests
- `style:` - Code style changes (formatting, etc.)
- `perf:` - Performance improvements

Examples:
```
feat: add regex toggle to search bar
fix: prevent tab overflow clipping
docs: update README with new theme list
chore: upgrade vitest to v3
```

## Code Style

### Prettier Configuration
- No semicolons
- Single quotes
- No trailing commas
- 120 character line width
- 2 space indentation

### ESLint Rules
- **Renderer** (`src/`): `no-console` enforced — use `src/utils/logger.ts` instead
- **Electron** (`electron/`): `no-console: 'off'` — `electron/logger.ts` wraps console
- `@typescript-eslint/no-explicit-any: 'error'` — avoid `any` types
- `eqeqeq: ['error', 'always']` — use strict equality (`===`)

## Architecture Overview

VoidTerm uses a two-process Electron architecture:

- **Main process** (`electron/`): Node.js runtime managing windows, PTY processes, and config persistence
- **Renderer process** (`src/`): React app with xterm.js for terminal rendering
- **IPC bridge** (`electron/preload.ts`): `contextBridge` provides `window.electronAPI`

State is managed with Zustand stores in `src/store/`. Terminal rendering uses xterm.js with WebGL addon.

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following the code style guidelines
4. Ensure all checks pass: `npm run lint && npm run typecheck && npm run test`
5. Commit with conventional commit messages
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request against `main`

## Testing

We use [Vitest](https://vitest.dev/) for unit tests. Test files are colocated with source code in `__tests__/` directories.

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

When adding new features, please include tests for:
- Utility functions
- Store actions and state transitions
- Edge cases and error handling
