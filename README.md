# VoidTerm

<p align="center">
  <img src="assets/icons/icon.png" alt="VoidTerm Logo" width="128" height="128">
</p>

<p align="center">
  <a href="https://github.com/bqrayvzdgn/VoidTerm/releases/latest"><img src="https://img.shields.io/github/v/release/bqrayvzdgn/VoidTerm?style=flat-square&color=blue" alt="Latest Release"></a>
  <a href="https://github.com/bqrayvzdgn/VoidTerm/blob/main/LICENSE"><img src="https://img.shields.io/github/license/bqrayvzdgn/VoidTerm?style=flat-square" alt="License"></a>
  <a href="https://github.com/bqrayvzdgn/VoidTerm/releases"><img src="https://img.shields.io/github/downloads/bqrayvzdgn/VoidTerm/total?style=flat-square&color=green" alt="Downloads"></a>
</p>

<p align="center">
  <a href="#english">English</a> •
  <a href="#türkçe">Türkçe</a>
</p>

---

# English

<p align="center">
  <strong>Modern, fast, cross-platform terminal emulator</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a> •
  <a href="#themes">Themes</a> •
  <a href="#configuration">Configuration</a>
</p>

## Features

### Core Features

- **Fast Performance** - WebGL-based render engine for high-performance terminal experience
- **Rich Theme Support** - 11 built-in themes + custom theme creation
- **Tabs & Panes** - Multiple tabs and vertical/horizontal split panes
- **Customizable Profiles** - Separate profile configurations for different shells
- **Workspace Support** - Group and manage your workspaces
- **Cross-Platform** - Windows, macOS, and Linux support
- **Multi-Language** - Turkish and English interface support

### Advanced Features

- **SSH Connections** - Direct SSH server connections and saved connection management
- **Snippets** - Save frequently used commands and run with one click
- **Broadcast Mode** - Send commands to all terminals simultaneously
- **In-Terminal Search** - Search terminal output with Ctrl+F (with history support)
- **Config Backup** - Backup and restore your settings
- **Auto-Update** - Automatic update support for new versions

### Security & Stability

- **Environment Whitelist** - Only safe environment variables are passed to terminal processes
- **IPC Rate Limiting** - Token-bucket rate limiter to prevent PTY operation abuse
- **SSH Input Validation** - Connection parameters are sanitized before saving
- **Error Boundaries** - Granular error isolation for terminal and panel components
- **PTY Cleanup** - Orphan process cleanup on renderer crash
- **Resize Debouncing** - Optimized window resizing
- **Structured Logging** - Context-aware structured log system for detailed debugging
- **268 Unit Tests** - Comprehensive test coverage across security and core modules

## Installation

### Ready-Made Releases

Download the installer for your operating system from the [Releases](https://github.com/bqrayvzdgn/VoidTerm/releases) page.

| Platform | Format |
|----------|--------|
| Windows  | `.exe` (NSIS Installer) |
| macOS    | `.dmg` |
| Linux    | `.AppImage`, `.deb` |

### Build from Source

```bash
# Clone the repo
git clone https://github.com/bqrayvzdgn/VoidTerm.git
cd VoidTerm

# Install dependencies
npm install

# Run in development mode
npm run dev

# Create production build
npm run build
```

#### Platform-Specific Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Development

### Requirements

- Node.js 18+
- npm or yarn
- Git

### Project Structure

```
VoidTerm/
├── electron/           # Electron main process
│   ├── main.ts         # Window and IPC management
│   ├── pty-manager.ts  # Terminal process management (env whitelist)
│   ├── config-manager.ts # Config and backup management
│   ├── auto-updater.ts # Auto-update with lazy loading
│   ├── rate-limiter.ts # IPC rate limiting (token-bucket)
│   ├── logger.ts       # Structured logging
│   └── preload.ts      # Renderer API bridge
├── src/                # React renderer process
│   ├── components/     # React components (ErrorBoundary, SSH, Terminal)
│   ├── store/          # Zustand state management
│   ├── themes/         # Terminal themes
│   ├── hooks/          # Custom React hooks
│   ├── i18n/           # Multi-language support
│   ├── utils/          # Utility functions (validation, logger)
│   └── types/          # TypeScript type definitions
├── e2e/                # End-to-end tests
├── assets/             # Icons and static files
└── scripts/            # Build and launch scripts
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron 28 |
| UI | React 18 |
| Bundler | Vite 5 |
| Terminal | xterm.js 6 + WebGL |
| PTY | node-pty |
| State | Zustand |
| Config | electron-store |
| Logging | electron-log |
| i18n | Custom implementation |
| Testing | Vitest + Playwright |
| Language | TypeScript 5 |

### Development Commands

```bash
# Development server
npm run dev

# Build Electron code only
npm run build:electron

# Run unit tests
npm run test

# Test watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate icons
npm run generate-icons
```

## Keyboard Shortcuts

### Tab & Pane Management

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` / `Cmd+T` | New tab |
| `Ctrl+W` / `Cmd+W` | Close tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+Shift+T` | Reopen closed tab |
| `Ctrl+Shift+D` | Split vertical |
| `Ctrl+Shift+E` | Split horizontal |
| `Ctrl+Shift+W` | Close pane |
| `Ctrl+Shift+M` | Maximize/minimize pane |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Alt+↑/↓/←/→` | Navigate between panes |

### Terminal Operations

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Copy |
| `Ctrl+Shift+V` | Paste |
| `Ctrl+F` | In-terminal search |
| `Ctrl+L` | Clear terminal |
| `Ctrl++` / `Ctrl+=` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Ctrl+0` | Reset zoom |

### Application

| Shortcut | Action |
|----------|--------|
| `Ctrl+,` / `Cmd+,` | Settings |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+Shift+S` | SSH manager |
| `Ctrl+Shift+B` | Broadcast mode |

> All keyboard shortcuts can be customized from Settings > Shortcuts.

## Themes

VoidTerm comes with the following built-in themes:

- **Catppuccin Mocha** (default) - Soft, pastel-toned dark theme
- **Dracula** - Popular purple-toned dark theme
- **One Dark** - Atom editor inspired theme
- **Tokyo Night** - Tokyo night scene inspired theme
- **Nord** - Arctic, blue-toned theme
- **GitHub Dark** - GitHub's dark theme
- **Windows Terminal** - Windows Terminal default theme
- **Gruvbox Dark** - Retro, warm-toned theme
- **Solarized Dark** - Eye-friendly, low-contrast theme
- **Monokai** - Sublime Text inspired classic theme
- **Material** - Google Material Design theme

### Custom Theme Creation

You can create your own custom theme from Settings > Themes. 16-color palette, cursor color, and selection color are customizable.

## Configuration

Configuration file is stored in platform-specific locations:

| Platform | Location |
|----------|----------|
| Windows  | `%APPDATA%/voidterm/config.json` |
| macOS    | `~/Library/Application Support/voidterm/config.json` |
| Linux    | `~/.config/voidterm/config.json` |

### Profile Configuration

The following settings can be configured for each profile:

- Shell path and arguments
- Working directory
- Environment variables
- Startup command
- Icon and color

### Backup & Restore

From Settings > Backup:

- Create manual backups
- View and restore previous backups
- Import/export configuration

## License

This project is licensed under the [MIT License](LICENSE).

## Contributing

We welcome your contributions! Before submitting a Pull Request:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages

## Contact

- **Issues**: [GitHub Issues](https://github.com/bqrayvzdgn/VoidTerm/issues)

---

# Türkçe

<p align="center">
  <strong>Modern, hızlı ve çapraz platform terminal emülatörü</strong>
</p>

<p align="center">
  <a href="#özellikler">Özellikler</a> •
  <a href="#kurulum">Kurulum</a> •
  <a href="#geliştirme">Geliştirme</a> •
  <a href="#klavye-kısayolları">Kısayollar</a> •
  <a href="#temalar">Temalar</a> •
  <a href="#yapılandırma">Yapılandırma</a>
</p>

## Özellikler

### Temel Özellikler

- **Hızlı Performans** - WebGL tabanlı render engine ile yüksek performanslı terminal deneyimi
- **Zengin Tema Desteği** - 11 yerleşik tema + özel tema oluşturma desteği
- **Sekme ve Panel Yönetimi** - Çoklu sekmeler ve dikey/yatay bölünmüş paneller
- **Özelleştirilebilir Profiller** - Farklı shell'ler için ayrı profil yapılandırmaları
- **Workspace Desteği** - Çalışma alanlarınızı gruplandırın ve yönetin
- **Çapraz Platform** - Windows, macOS ve Linux desteği
- **Çoklu Dil** - Türkçe ve İngilizce arayüz desteği

### Gelişmiş Özellikler

- **SSH Bağlantıları** - SSH sunucularına doğrudan bağlantı ve kayıtlı bağlantı yönetimi
- **Kod Parçacıkları (Snippets)** - Sık kullanılan komutları kaydedin ve tek tıkla çalıştırın
- **Broadcast Modu** - Aynı anda tüm terminallere komut gönderin
- **Terminal İçi Arama** - Ctrl+F ile terminal çıktısında arama (geçmiş desteği ile)
- **Yapılandırma Yedekleme** - Ayarlarınızı yedekleyin ve geri yükleyin
- **Otomatik Güncelleme** - Yeni sürümler için otomatik güncelleme desteği

### Güvenlik ve Stabilite

- **Ortam Değişkeni Beyaz Listesi** - Terminal süreçlerine sadece güvenli ortam değişkenleri aktarılır
- **IPC Hız Sınırlama** - PTY işlem suistimalini önlemek için token-bucket hız sınırlayıcı
- **SSH Giriş Doğrulama** - Bağlantı parametreleri kaydedilmeden önce temizlenir
- **Hata Sınırları** - Terminal ve panel bileşenleri için ayrıntılı hata izolasyonu
- **PTY Cleanup** - Renderer crash durumunda orphan process temizleme
- **Resize Debouncing** - Optimize edilmiş pencere boyutlandırma
- **Structured Logging** - Detaylı hata ayıklama için bağlam farkındalıklı yapılandırılmış log sistemi
- **268 Birim Test** - Güvenlik ve çekirdek modüller için kapsamlı test kapsamı

## Kurulum

### Hazır Sürümler

[Releases](https://github.com/bqrayvzdgn/VoidTerm/releases) sayfasından işletim sisteminize uygun kurulum dosyasını indirin.

| Platform | Format |
|----------|--------|
| Windows  | `.exe` (NSIS Installer) |
| macOS    | `.dmg` |
| Linux    | `.AppImage`, `.deb` |

### Kaynak Koddan Derleme

```bash
# Repoyu klonlayın
git clone https://github.com/bqrayvzdgn/VoidTerm.git
cd VoidTerm

# Bağımlılıkları yükleyin
npm install

# Geliştirme modunda çalıştırın
npm run dev

# Production build oluşturun
npm run build
```

#### Platforma Özel Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Geliştirme

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Git

### Proje Yapısı

```
VoidTerm/
├── electron/           # Electron ana süreç kodları
│   ├── main.ts         # Pencere ve IPC yönetimi
│   ├── pty-manager.ts  # Terminal süreç yönetimi (ortam beyaz listesi)
│   ├── config-manager.ts # Yapılandırma ve yedekleme yönetimi
│   ├── auto-updater.ts # Lazy loading ile otomatik güncelleme
│   ├── rate-limiter.ts # IPC hız sınırlama (token-bucket)
│   ├── logger.ts       # Structured logging (electron-log)
│   └── preload.ts      # Renderer API köprüsü
├── src/                # React renderer süreci
│   ├── components/     # React bileşenleri (ErrorBoundary, SSH, Terminal)
│   ├── store/          # Zustand state yönetimi
│   ├── themes/         # Terminal temaları
│   ├── hooks/          # Custom React hooks
│   ├── i18n/           # Çoklu dil desteği (tr/en)
│   ├── utils/          # Yardımcı fonksiyonlar (validation, logger)
│   └── types/          # TypeScript tip tanımları
├── e2e/                # End-to-end testler (Playwright)
├── assets/             # İkonlar ve statik dosyalar
└── scripts/            # Build ve başlatma scriptleri
```

### Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Electron 28 |
| UI | React 18 |
| Bundler | Vite 5 |
| Terminal | xterm.js 6 + WebGL |
| PTY | node-pty |
| State | Zustand |
| Config | electron-store |
| Logging | electron-log |
| i18n | Custom implementation |
| Testing | Vitest + Playwright |
| Language | TypeScript 5 |

### Geliştirme Komutları

```bash
# Geliştirme sunucusu (Vite + Electron)
npm run dev

# Sadece Electron kodlarını derle
npm run build:electron

# Unit testleri çalıştır
npm run test

# Test izleme modu
npm run test:watch

# E2E testleri çalıştır
npm run test:e2e

# İkon oluştur
npm run generate-icons
```

## Klavye Kısayolları

### Sekme ve Panel Yönetimi

| Kısayol | İşlev |
|---------|-------|
| `Ctrl+T` / `Cmd+T` | Yeni sekme |
| `Ctrl+W` / `Cmd+W` | Sekmeyi kapat |
| `Ctrl+Tab` | Sonraki sekme |
| `Ctrl+Shift+Tab` | Önceki sekme |
| `Ctrl+Shift+T` | Kapatılan sekmeyi yeniden aç |
| `Ctrl+Shift+D` | Dikey bölme |
| `Ctrl+Shift+E` | Yatay bölme |
| `Ctrl+Shift+W` | Paneli kapat |
| `Ctrl+Shift+M` | Paneli maksimize et/küçült |

### Navigasyon

| Kısayol | İşlev |
|---------|-------|
| `Alt+↑/↓/←/→` | Paneller arası geçiş |

### Terminal İşlemleri

| Kısayol | İşlev |
|---------|-------|
| `Ctrl+Shift+C` | Kopyala |
| `Ctrl+Shift+V` | Yapıştır |
| `Ctrl+F` | Terminal içi arama |
| `Ctrl+L` | Terminal temizle |
| `Ctrl++` / `Ctrl+=` | Yakınlaştır |
| `Ctrl+-` | Uzaklaştır |
| `Ctrl+0` | Zoom sıfırla |

### Uygulama

| Kısayol | İşlev |
|---------|-------|
| `Ctrl+,` / `Cmd+,` | Ayarlar |
| `Ctrl+Shift+P` | Komut paleti |
| `Ctrl+Shift+S` | SSH yöneticisi |
| `Ctrl+Shift+B` | Broadcast modu |

> **Not:** Tüm klavye kısayolları Ayarlar > Kısayollar bölümünden özelleştirilebilir.

## Temalar

VoidTerm aşağıdaki yerleşik temalarla birlikte gelir:

- **Catppuccin Mocha** (varsayılan) - Yumuşak, pastel tonlarda karanlık tema
- **Dracula** - Popüler mor tonlu karanlık tema
- **One Dark** - Atom editöründen ilham alan tema
- **Tokyo Night** - Tokyo gece manzarasından ilham alan tema
- **Nord** - Arktik, mavi tonlu tema
- **GitHub Dark** - GitHub'ın karanlık teması
- **Windows Terminal** - Windows Terminal varsayılan teması
- **Gruvbox Dark** - Retro, sıcak tonlu tema
- **Solarized Dark** - Göz yormayan, düşük kontrastlı tema
- **Monokai** - Sublime Text'ten ilham alan klasik tema
- **Material** - Google Material Design teması

### Özel Tema Oluşturma

Ayarlar > Temalar bölümünden kendi özel temanızı oluşturabilirsiniz. 16 renk paleti, imleç rengi ve seçim rengi özelleştirilebilir.

## Yapılandırma

Yapılandırma dosyası platforma göre şu konumlarda saklanır:

| Platform | Konum |
|----------|-------|
| Windows  | `%APPDATA%/voidterm/config.json` |
| macOS    | `~/Library/Application Support/voidterm/config.json` |
| Linux    | `~/.config/voidterm/config.json` |

### Profil Yapılandırması

Her profil için aşağıdaki ayarlar yapılandırılabilir:

- Shell yolu ve argümanları
- Çalışma dizini
- Ortam değişkenleri
- Başlangıç komutu
- İkon ve renk

### Yedekleme ve Geri Yükleme

Ayarlar > Yedekleme bölümünden:

- Manuel yedek oluşturabilirsiniz
- Önceki yedekleri görüntüleyebilir ve geri yükleyebilirsiniz
- Yapılandırmayı dışa/içe aktarabilirsiniz

> **Not:** Sistem otomatik olarak geri yükleme öncesinde mevcut yapılandırmanın yedeğini alır.

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir Pull Request göndermeden önce:

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Geliştirme Kuralları

- Yeni özellikler için test yazmayı unutmayın
- Commit mesajlarında [Conventional Commits](https://www.conventionalcommits.org/) kullanın

## İletişim

- **Issues**: [GitHub Issues](https://github.com/bqrayvzdgn/VoidTerm/issues)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/bqrayvzdgn">bqrayvzdgn</a>
</p>