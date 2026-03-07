# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

## [1.0.2] - 2026-03-06

### Added
- Terminal emulator core with xterm.js 6 and WebGL rendering
- 11 built-in color themes (Catppuccin Mocha, Dracula, One Dark, Tokyo Night, Nord, GitHub Dark, Windows Terminal, Gruvbox Dark, Solarized Dark, Monokai, Material)
- Custom theme creation and import/export
- Tab and split pane management (vertical/horizontal)
- Configurable shell profiles with per-profile settings
- Workspace support for organizing terminal sessions
- SSH connection manager with saved connections
- Broadcast mode for simultaneous input to all terminals
- In-terminal search with history support
- Vi mode (copy mode) with vim-like navigation
- Shell integration (OSC 633) with command blocks and CWD tracking
- Configuration backup and restore system (up to 5 automatic backups)
- Deep link support (voidterm:// protocol)
- Quake mode (F12 toggle, top-of-screen dropdown)
- Internationalization (English and Turkish)
- Auto-update support via electron-updater
- Command palette (Ctrl+Shift+P)
- Customizable keyboard shortcuts

### Security
- IPC rate limiting via token-bucket algorithm
- Environment variable whitelist for PTY processes
- SSH input validation and sanitization
- Content Security Policy headers
- Context isolation and sandbox enforcement
- Path traversal prevention for IPC path-join
- Protocol whitelist for external link opening
