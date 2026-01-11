# AGENTS.md

Bu dosya, VoidTerm deposunda calisan AI kodlama ajanlari icin rehber niteligindedir.

## Proje Ozeti

VoidTerm, React, xterm.js, Zustand ve node-pty ile insa edilmis Electron tabanli bir terminal emulatorudur. Split pane, workspace, profil ve tema ozellikleri icerir.

## Derleme ve Gelistirme Komutlari

```bash
# Bagimliliklari yukle (Node.js 18+ gerektirir)
npm install

# Gelistirme modu (Vite + Electron esli calisir)
npm run dev

# Sadece electron ana islemini derle
npm run build:electron

# Tam uretim derlemesi
npm run build

# Platforma ozel derlemeler
npm run build:win     # Windows
npm run build:mac     # macOS
npm run build:linux   # Linux

# assets/source-icon.png'den ikon olustur
npm run generate-icons
```

## Test

Test altyapisi mevcut ancak henuz test yazilmamis:
- Framework: Vitest + jsdom
- React: @testing-library/react, @testing-library/jest-dom
- Test dosyalari `.test.ts` veya `.test.tsx` uzantisi kullanmali

```bash
# Test scripti eklendiginde (package.json: "test": "vitest")
npx vitest run                          # Tum testler
npx vitest run path/to/file.test.ts     # Tek dosya
npx vitest run -t "test adi deseni"     # Desen eslestirme
```

## Kod Stili Kurallari

### TypeScript Yapilandirmasi

Strict mod aktif:
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- Target: ES2020, JSX: react-jsx

### Import Sirasi

1. React ve core kutuphane importlari
2. Ucuncu parti kutuphaneler (xterm, uuid, zustand)
3. `@/` alias ile dahili importlar
4. `import type { ... }` ile tip importlari
5. CSS importlari en sonda

```typescript
import React, { useEffect, useState, useCallback } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { TabBar } from '@/components/TabBar/TabBar'
import { useTerminalStore } from '@/store/terminalStore'
import type { Tab, Pane, TerminalState } from '@/types'
import '@/styles/main.css'
```

### Path Alias

`@/*` kullanarak `src/*` importlari yap:
```typescript
import { useTerminalStore } from '@/store/terminalStore'
import type { Profile } from '@/types'
```

### Adlandirma Kurallari

| Kategori | Kural | Ornek |
|----------|-------|-------|
| Bilesenler | PascalCase (klasor icinde) | `TabBar/TabBar.tsx` |
| Hook'lar | camelCase + `use` | `useTerminalManager.ts` |
| Store'lar | camelCase + `Store` | `terminalStore.ts` |
| Tipler/Interface | PascalCase | `Theme`, `Profile`, `Pane` |
| Props | `ComponentNameProps` | `TabBarProps` |
| Fonksiyonlar | camelCase | `handleCloseTab`, `collectTerminalIds` |
| Event handler | `handle` prefix | `handleSplit`, `handleCreateTab` |
| Callback prop | `on` prefix | `onNewTab`, `onCloseTab` |
| Boolean | `is` prefix | `isMaximized`, `isActive` |
| Ref | `Ref` suffix | `containerRef`, `terminalRef` |
| CSS class | kebab-case | `app-container`, `terminal-search-bar` |
| Sabitler | SCREAMING_SNAKE_CASE | `MAX_CLOSED_TABS` |

### Tip Tanimlari

```typescript
// Props interface
interface TerminalViewProps {
  ptyId: string
  onTitleChange?: (title: string) => void
  isActive?: boolean
}

// Union type
type: 'terminal' | 'split'
direction?: 'horizontal' | 'vertical'
cursorStyle: 'block' | 'underline' | 'bar'

// Zustand store
export const useTerminalStore = create<TerminalStore>((set, get) => ({...}))

// forwardRef
export const TerminalView = forwardRef<TerminalViewHandle, TerminalViewProps>(...)
```

### Hata Yonetimi

```typescript
// Try-catch ile aciklayici hatalar
try {
  const ptyId = await window.electronAPI.ptyCreate({...})
} catch (error) {
  console.error('Terminal olusturulamadi:', error)
  throw new Error(`Terminal olusturulamadi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
}

// Opsiyonel ozellikler icin graceful degradation
try {
  const webglAddon = new WebglAddon()
  terminal.loadAddon(webglAddon)
} catch (e) {
  console.warn('WebGL addon basarisiz, canvas renderer kullaniliyor')
}

// Async store operasyonlari
loadFromConfig: async () => {
  try {
    const [settings, profiles] = await Promise.all([...])
    set({ settings, profiles, isLoaded: true })
  } catch (error) {
    console.error('Config yuklenemedi:', error)
    set({ isLoaded: true }) // UI'yi bloke etme
  }
}
```

### React Desenleri

- Fonksiyonel bilesenler + hook kullan
- Alt bilesenlere gecirilen handler'lar icin `useCallback`
- Pahali hesaplamalar icin `useMemo`
- `useEffect` icin uygun cleanup fonksiyonlari
- Metod acmak icin `forwardRef` + `useImperativeHandle`
- Gereksiz render onlemek icin `useShallow` ile Zustand selector

## Proje Yapisi

```
VoidTerm/
├── electron/               # Ana islem (CommonJS)
│   ├── main.ts            # Pencere, menu, IPC handler
│   ├── pty-manager.ts     # PTY islem yonetimi
│   ├── config-manager.ts  # Kalici yapilandirma (electron-store)
│   └── preload.ts         # Renderer'a IPC koprusu
├── src/                   # Renderer islemi (ESM/React)
│   ├── components/        # React bilesenleri (klasor basina bilesen)
│   ├── hooks/             # Ozel React hook'lari
│   ├── store/             # Zustand store'lari
│   ├── types/             # TypeScript tip tanimlari
│   ├── themes/            # Terminal renk temalari
│   ├── utils/             # Yardimci fonksiyonlar
│   ├── styles/            # Global CSS
│   └── App.tsx            # Ana uygulama bileseni
├── assets/                # Statik varliklar (ikonlar)
└── scripts/               # Derleme betikleri
```

## IPC Iletisimi

Renderer, `window.electronAPI` uzerinden ana islemle iletisim kurar:
- `ptyCreate()`, `ptyWrite()`, `ptyResize()`, `ptyKill()` - Terminal islemleri
- `onPtyData()`, `onPtyExit()` - Event listener'lar
- `configGet()`, `configSet()` - Yapilandirma islemleri
- PTY ID'leri, terminal orneklerini islemlere eslestiren UUID'lerdir

## Kritik Dosyalar

- `src/types/index.ts` - Temel tip tanimlari (Pane, Tab, Profile, Settings)
- `src/store/terminalStore.ts` - Terminal/sekme durum yonetimi
- `src/hooks/useTerminalManager.ts` - Terminal yasam dongusu
- `electron/pty-manager.ts` - PTY islem yonetimi
- `electron/config-manager.ts` - Kalici yapilandirma
