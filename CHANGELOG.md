# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

- [English](#english)
- [Türkçe](#türkçe)

---

## English

### [1.2.0] - 2025

#### Added

- PTY environment variable whitelist to prevent secret leakage to child processes
- IPC rate limiting with token-bucket algorithm for PTY operations
- SSH connection form validation with input sanitization and toast feedback
- Platform-aware shell path escaping for SSH private key paths
- Granular error boundaries (TerminalErrorBoundary, PanelErrorBoundary)
- ESLint flat config and Prettier for code style enforcement
- 268 unit tests across 8 test files (rate-limiter, env-whitelist, shell-escape, url, logger, ErrorBoundary, snippetStore, customThemeStore)
- `launch-electron.js` script for reliable Electron launch from VSCode
- `-NoLogo` flag for PowerShell/pwsh shell startup

#### Fixed

- Legacy Windows PowerShell blue (#012456) background in terminal
- `ELECTRON_RUN_AS_NODE` environment variable preventing Electron from starting in VSCode
- Module-level crashes from `app.isPackaged`, `app.getPath()`, and `autoUpdater` accessed before app ready
- PTY cleanup crash (`AttachConsole failed`) on window close (node-pty Windows issue)
- Keyboard shortcut inconsistency for `toggleSidebar` (`Ctrl+B` → `Ctrl+Shift+B`)
- Silent clipboard error handling replaced with proper warning logs
- DevTools no longer auto-opens in dev mode (use `Ctrl+Shift+I` manually)

#### Changed

- All `console.log` calls replaced with structured `createLogger()` across 10+ components
- PTY processes now receive only whitelisted environment variables instead of full `process.env`

### [1.1.1] - 2024

#### Fixed

- Hide inactive cursor to prevent double cursor display

#### Documentation

- Fix keyboard shortcuts in documentation
- Update README theme count from 6 to 11
- Update README with version badges and keyboard shortcuts

#### Maintenance

- Update author name to bqrayvzdgn
- Add MIT License

### [1.1.0] - 2024

#### Added

- Profile selection for terminal creation
- Expanded keyboard shortcuts
- Robustness improvements and structured logging
- Testing infrastructure (Vitest + Playwright)
- Internationalization support (Turkish and English)
- Snippets feature for saving frequently used commands
- Toast notification system
- Session restore functionality
- Move to workspace feature
- Context menus for tabs
- Reopen closed tab functionality
- Pane maximize/minimize feature
- Tab color customization
- Extended workspace colors and icons for unlimited workspaces
- Emoji icons for workspaces
- Broadcast mode for sending commands to all terminals
- Quake mode (dropdown terminal)
- SSH manager
- Command palette
- In-terminal search with history support

#### Fixed

- Validate workspace existence before restoring session tabs
- Replace nested buttons with div/span to fix DOM nesting warning
- Wait for profiles to load before restoring session
- Remove New Workspace from tab context menu (when not needed)
- Only show workspace selector when a workspace is active
- Improve explorer icon visibility and sizing
- Keep profile name as tab title, ignore terminal title changes
- Clean up terminal tab titles - extract folder name from paths
- Update rootDir in tsconfig.node.json to fix vite.config.ts include

#### Refactored

- Major code improvements and accessibility enhancements

#### Maintenance

- Update .gitignore with testing and build artifacts
- Add .gitattributes for consistent line endings
- Switch to ESM to fix Vite CJS deprecation warning (reverted)

### [1.0.0] - 2024

#### Added

- Initial release
- Electron-based terminal emulator
- React 18 with Vite 5
- xterm.js 6 with WebGL rendering
- node-pty for terminal process management
- Zustand for state management
- electron-store for configuration
- Multiple tabs and split panes (horizontal/vertical)
- 11 built-in themes
- Custom theme creation
- Shell profiles with custom configurations
- Workspace management
- Cross-platform support (Windows, macOS, Linux)
- Auto-update functionality
- Configuration backup and restore

---

## Türkçe

### [1.2.0] - 2025

#### Eklenenler

- Alt süreçlere gizli bilgi sızmasını önlemek için PTY ortam değişkeni beyaz listesi
- PTY işlemleri için token-bucket algoritmalı IPC hız sınırlama
- Giriş temizleme ve toast geri bildirimi ile SSH bağlantı form doğrulaması
- SSH özel anahtar yolları için platforma duyarlı shell yol kaçışı
- Ayrıntılı hata sınırları (TerminalErrorBoundary, PanelErrorBoundary)
- Kod stili uygulaması için ESLint flat config ve Prettier
- 8 test dosyasında 268 birim test (rate-limiter, env-whitelist, shell-escape, url, logger, ErrorBoundary, snippetStore, customThemeStore)
- VSCode'dan güvenilir Electron başlatma için `launch-electron.js` scripti
- PowerShell/pwsh shell başlatma için `-NoLogo` bayrağı

#### Düzeltmeler

- Terminalde eski Windows PowerShell mavi (#012456) arka planı düzeltildi
- VSCode'da Electron'un başlamasını engelleyen `ELECTRON_RUN_AS_NODE` ortam değişkeni düzeltildi
- Uygulama hazır olmadan önce erişilen `app.isPackaged`, `app.getPath()` ve `autoUpdater` modül seviyesi çökmeleri düzeltildi
- Pencere kapatılırken PTY temizleme çökmesi (`AttachConsole failed`) düzeltildi (node-pty Windows sorunu)
- `toggleSidebar` klavye kısayolu tutarsızlığı düzeltildi (`Ctrl+B` → `Ctrl+Shift+B`)
- Sessiz pano hata işleme, uygun uyarı logları ile değiştirildi
- DevTools artık geliştirme modunda otomatik açılmıyor (`Ctrl+Shift+I` ile manuel açılabilir)

#### Değişiklikler

- Tüm `console.log` çağrıları 10+ bileşende yapılandırılmış `createLogger()` ile değiştirildi
- PTY süreçleri artık tam `process.env` yerine sadece beyaz listedeki ortam değişkenlerini alıyor

### [1.1.1] - 2024

#### Düzeltmeler

- Çift imleç görüntülenmesini önlemek için aktif olmayan imleç gizlendi

#### Dokümantasyon

- Dokümantasyondaki klavye kısayolları düzeltildi
- README'deki tema sayısı 6'dan 11'e güncellendi
- README'ye versiyon rozetleri ve klavye kısayolları eklendi

#### Bakım

- Yazar adı bqrayvzdgn olarak güncellendi
- MIT Lisansı eklendi

### [1.1.0] - 2024

#### Eklenenler

- Terminal oluşturma için profil seçimi
- Genişletilmiş klavye kısayolları
- Sağlamlık iyileştirmeleri ve yapılandırılmış loglama
- Test altyapısı (Vitest + Playwright)
- Uluslararasılaştırma desteği (Türkçe ve İngilizce)
- Sık kullanılan komutları kaydetmek için snippet özelliği
- Toast bildirim sistemi
- Oturum geri yükleme özelliği
- Workspace'e taşıma özelliği
- Sekmeler için bağlam menüleri
- Kapatılan sekmeyi yeniden açma özelliği
- Panel maksimize/minimize özelliği
- Sekme renk özelleştirmesi
- Sınırsız workspace için genişletilmiş renkler ve ikonlar
- Workspace'ler için emoji ikonları
- Tüm terminallere komut göndermek için broadcast modu
- Quake modu (açılır terminal)
- SSH yöneticisi
- Komut paleti
- Geçmiş desteği ile terminal içi arama

#### Düzeltmeler

- Oturum sekmelerini geri yüklemeden önce workspace varlığı doğrulaması
- DOM iç içe geçme uyarısını düzeltmek için iç içe butonlar div/span ile değiştirildi
- Oturumu geri yüklemeden önce profillerin yüklenmesi bekleniyor
- Gerekli olmadığında sekme bağlam menüsünden Yeni Workspace kaldırıldı
- Workspace seçici sadece bir workspace aktifken gösteriliyor
- Explorer ikon görünürlüğü ve boyutlandırması iyileştirildi
- Profil adı sekme başlığı olarak korunuyor, terminal başlık değişiklikleri yoksayılıyor
- Terminal sekme başlıkları temizlendi - yollardan klasör adı çıkarılıyor
- vite.config.ts dahil etme sorununu düzeltmek için tsconfig.node.json'da rootDir güncellendi

#### Yeniden Düzenleme

- Büyük kod iyileştirmeleri ve erişilebilirlik geliştirmeleri

#### Bakım

- .gitignore test ve build artifact'ları ile güncellendi
- Tutarlı satır sonları için .gitattributes eklendi
- Vite CJS kullanımdan kaldırma uyarısını düzeltmek için ESM'e geçildi (geri alındı)

### [1.0.0] - 2024

#### Eklenenler

- İlk sürüm
- Electron tabanlı terminal emülatörü
- Vite 5 ile React 18
- WebGL render ile xterm.js 6
- Terminal süreç yönetimi için node-pty
- State yönetimi için Zustand
- Yapılandırma için electron-store
- Çoklu sekmeler ve bölünmüş paneller (yatay/dikey)
- 11 yerleşik tema
- Özel tema oluşturma
- Özel yapılandırmalı shell profilleri
- Workspace yönetimi
- Çapraz platform desteği (Windows, macOS, Linux)
- Otomatik güncelleme özelliği
- Yapılandırma yedekleme ve geri yükleme
