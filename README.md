# VoidTerm

<p align="center">
  <img src="assets/icons/icon.png" alt="VoidTerm Logo" width="128" height="128">
</p>

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

---

## 🚀 Özellikler

- **⚡ Hızlı Performans** - WebGL tabanlı render engine ile yüksek performanslı terminal deneyimi
- **🎨 Zengin Tema Desteği** - Catppuccin Mocha, Dracula, One Dark, Tokyo Night, Nord ve GitHub Dark temaları
- **📑 Sekme ve Panel Yönetimi** - Çoklu sekmeler ve dikey/yatay bölünmüş paneller
- **🔧 Özelleştirilebilir Profiller** - Farklı shell'ler için ayrı profil yapılandırmaları
- **💼 Workspace Desteği** - Çalışma alanlarınızı kaydedin ve yönetin
- **🖥️ Çapraz Platform** - Windows, macOS ve Linux desteği
- **🎯 Native Deneyim** - Electron tabanlı native uygulama

## 📦 Kurulum

### Hazır Sürümler

[Releases](https://github.com/voidterm/voidterm/releases) sayfasından işletim sisteminize uygun kurulum dosyasını indirin:

| Platform | Format |
|----------|--------|
| Windows  | `.exe` (NSIS Installer) |
| macOS    | `.dmg` |
| Linux    | `.AppImage`, `.deb` |

### Kaynak Koddan Derleme

```bash
# Repoyu klonlayın
git clone https://github.com/voidterm/voidterm.git
cd voidterm

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

## 🛠️ Geliştirme

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Git

### Proje Yapısı

```
VoidTerm/
├── electron/           # Electron ana süreç kodları
│   ├── main.ts         # Pencere ve IPC yönetimi
│   ├── pty-manager.ts  # Terminal süreç yönetimi (node-pty)
│   ├── config-manager.ts # Yapılandırma yönetimi
│   └── preload.ts      # Renderer API köprüsü
├── src/                # React renderer süreci
│   ├── components/     # React bileşenleri
│   ├── store/          # Zustand state yönetimi
│   ├── themes/         # Terminal temaları
│   ├── hooks/          # Custom React hooks
│   └── types/          # TypeScript tip tanımları
├── assets/             # İkonlar ve statik dosyalar
└── scripts/            # Build yardımcı scriptleri
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
| Language | TypeScript 5 |

### Geliştirme Komutları

```bash
# Geliştirme sunucusu (Vite + Electron)
npm run dev

# Sadece Electron kodlarını derle
npm run build:electron

# İkon oluştur
npm run generate-icons
```

## ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
|---------|-------|
| `Ctrl+T` / `Cmd+T` | Yeni sekme |
| `Ctrl+W` / `Cmd+W` | Sekmeyi kapat |
| `Ctrl+Shift+D` | Dikey bölme |
| `Ctrl+Shift+E` | Yatay bölme |
| `Ctrl+,` / `Cmd+,` | Ayarlar |

## 🎨 Temalar

VoidTerm aşağıdaki yerleşik temalarla birlikte gelir:

- **Catppuccin Mocha** (varsayılan) - Yumuşak, pastel tonlarda karanlık tema
- **Dracula** - Popüler mor tonlu karanlık tema
- **One Dark** - Atom editöründen ilham alan tema
- **Tokyo Night** - Tokyo gece manzarasından ilham alan tema
- **Nord** - Arktik, mavi tonlu tema
- **GitHub Dark** - GitHub'ın karanlık teması

## ⚙️ Yapılandırma

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
- Tema seçimi

## 🏗️ Mimari

### Süreç Ayrımı

VoidTerm, Electron'un çift süreç mimarisini kullanır:

**Ana Süreç (Main Process)**
- Pencere yönetimi
- PTY (pseudo-terminal) işlemleri
- Yapılandırma yönetimi
- Sistem menüleri

**Renderer Süreci**
- React tabanlı kullanıcı arayüzü
- xterm.js ile terminal görüntüleme
- Zustand ile state yönetimi

### IPC İletişimi

Renderer süreci, `window.electronAPI` üzerinden ana süreç ile iletişim kurar:

```typescript
// Terminal oluşturma
await window.electronAPI.ptyCreate(id, profile)

// Veri gönderme
window.electronAPI.ptyWrite(id, data)

// Veri alma
window.electronAPI.onPtyData(id, callback)
```

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir Pull Request göndermeden önce:

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 İletişim

- **Issues**: [GitHub Issues](https://github.com/voidterm/voidterm/issues)
- **Discussions**: [GitHub Discussions](https://github.com/voidterm/voidterm/discussions)

---

<p align="center">
  Made with ❤️ by VoidTerm Contributors
</p>
