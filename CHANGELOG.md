# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

- [English](#english)
- [Türkçe](#türkçe)

---

## English

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
