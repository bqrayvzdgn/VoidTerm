# VoidTerm - Manuel Test Checklist

> Bu dosyadaki senaryolar Playwright ile otomatiklestirilemeyen testlerdir.
> Her birini elle test edip sonucu isaretleyin.
>
> Tarih: 2026-03-15 | Surum: 1.0.2

---

## MT-01: Quake Mode (Global Shortcut)

**Neden otomatik degil:** OS seviyesinde global shortcut Playwright tarafindan yakalanamaz.

- [ ] Settings → Terminal → Quake Mode'u ac
- [ ] Kisayol olarak `Ctrl+\`` ata
- [ ] Settings'i kapat
- [ ] `Ctrl+\`` bas → pencere ekranin ustunden kayarak acilir
- [ ] Tekrar `Ctrl+\`` bas → pencere gizlenir
- [ ] Quake modundayken pencere disina tikla → pencere gizlenir
- [ ] Quake yukseklik yuzdesini %40'a ayarla → pencere yuksekligi degisir
- [ ] Quake modunu kapat → global shortcut artik calismaz

---

## MT-02: Tab Pin/Unpin (Context Menu)

**Neden otomatik degil:** Playwright'ta React portal uzerinden context menu click'leri guvenilir degil.

- [ ] Tab'a sag tikla → context menu acilir
- [ ] "Pin Tab" sec → tab pinlenir, pin ikonu gorunur, X butonu kalkar
- [ ] Pinli tab daima tab bar'in basinda yer alir
- [ ] Tekrar sag tikla → "Unpin Tab" sec → pin kalkar

---

## MT-03: Drag & Drop Tab Siralama

**Neden otomatik degil:** Mouse drag simulate'u kirilgan ve guvensiz.

- [ ] 3+ tab ac
- [ ] 3. tab'i suruklayip 1. konuma birak → tab yeri degisir
- [ ] Pinli bir tab olustur, pin'siz tab'i pinin onune surulemeyi dene → engellenir
- [ ] Tab'i surukleme sirasinda birakmadan Escape'e bas → iptal olur

---

## MT-03: Mica / Acrylic / Blur Gorsel Efektleri

**Neden otomatik degil:** Gorsel efektler pixel bazinda dogrulanamaz.

- [ ] Windows 11'de uygulamayi calistir
- [ ] Settings → Appearance → Blur'u ac → arka plan bulaniklasir (Acrylic/Mica)
- [ ] Opacity'yi 0.8'e cek → pencere yari saydam olur, arkadaki masaustu gorunur
- [ ] Opacity'yi 1'e geri al → pencere tamamen opak
- [ ] Blur'u kapat → bulaniklik kalkar

---

## MT-04: Arkaplan Gorseli Secimi (Native File Dialog)

**Neden otomatik degil:** Native OS dosya secim dialogu Playwright ile kontrol edilemez.

- [ ] Settings → Appearance → "Select Background Image" tikla
- [ ] OS dosya dialogu acilir → bir PNG/JPG sec
- [ ] Gorsel terminal arkasinda gorunur
- [ ] Opacity slider'i → gorsel saydamligi degisir
- [ ] Blur slider'i → gorsel bulanikligi degisir
- [ ] "Clear" butonuna tikla → gorsel kalkar
- [ ] Desteklenmeyen format (`.bmp`, `.svg`) secmeyi dene → filtre engeller

---

## MT-05: Copy on Select & Clipboard

**Neden otomatik degil:** Gercek sistem clipboard'u Playwright Electron'da guvenilir degil.

- [ ] Settings → Terminal → "Copy on Select" ac
- [ ] Terminalde bir metin sec (mouse ile surukleme) → otomatik kopyalanir
- [ ] Notepad'e yapistir → kopyalanan metin dogru
- [ ] "Copy on Select" kapat → secim artik otomatik kopyalamaz
- [ ] Ctrl+Shift+C ile manuel kopyala → calisir
- [ ] Ctrl+Shift+V ile yapistir → calisir

---

## MT-06: Bell Sound

**Neden otomatik degil:** Ses cikisini programatik olarak dogrulamak mumkun degil.

- [ ] Settings → Terminal → "Bell Sound" ac
- [ ] Terminalde `echo -e '\a'` veya `printf '\a'` calistir
- [ ] Ses duyulur (system bell)
- [ ] "Bell Sound" kapat → ses duyulmaz

---

## MT-07: SSH Baglanti Testi

**Neden otomatik degil:** Gercek bir SSH sunucusu gerektirir.

- [ ] Settings → Profiles → yeni SSH profili olustur
- [ ] Host, port, username, auth method (password) gir
- [ ] Bu profille terminal ac → SSH baglantisi baslar
- [ ] Sifre sor → gir → basarili baglanti
- [ ] Key-based auth ile profil olustur → key path belirt
- [ ] Bu profille baglan → sifresiz baglanti
- [ ] Gecersiz host ile dene → hata mesaji gorunur
- [ ] Metacharacter iceren host (`; rm -rf /`) → reddedilir

---

## MT-08: WebGL / Canvas Renderer

**Neden otomatik degil:** Renderer tipini programatik olarak ayirt etmek zor.

- [ ] Normal calistirmada terminal akici render eder (WebGL)
- [ ] GPU hizlandirmayi kapat (`--disable-gpu` flag) → terminal hala calisir (Canvas fallback)
- [ ] Her iki modda da renkli cikti (ls --color, git diff vb.) dogru gorunur
- [ ] Buyuk cikti (10K+ satir) her iki modda da donma olmadan render eder

---

## MT-09: Performans Testi

**Neden otomatik degil:** Performans olcumu subjektif ve ortama bagli.

### Coklu Terminal
- [ ] 5 tab ac → UI akici kalir, tab gecisleri hizli
- [ ] 10 tab ac → bellek kullanimi makul (Task Manager ile kontrol)
- [ ] Her tab'da komut calistir → diger tab'lar etkilenmez

### Buyuk Cikti
- [ ] `type C:\Windows\System32\drivers\etc\services` veya buyuk dosya cat et
- [ ] Terminal donmaz, scroll calisir
- [ ] Arama (Ctrl+F) bu buffer'da eslesme bulur

### Split Pane Performans
- [ ] 2x2 layout olustur → 4 terminal calisir
- [ ] Her terminalde komut calistir → donma yok
- [ ] Pane boyutlandirma akici

---

## MT-10: Legacy PowerShell Mavi Arka Plan

**Neden otomatik degil:** Renk kalibrasyonu gorsel dogrulama gerektirir.

- [ ] Varsayilan profilde shell olarak `powershell.exe` (legacy, pwsh degil) sec
- [ ] Terminal ac → arka plan mavi degil, tema rengi uygulanmis
- [ ] `[Console]::BackgroundColor` kontrol et → siyah veya tema rengi
- [ ] pwsh (PowerShell 7) ile ayni testi yap → ayni sonuc

---

## MT-11: Context Menu Pozisyonu

**Neden otomatik degil:** Ekran kenari davranisi test ortamina bagli.

- [ ] Terminalin ortasinda sag tikla → menu tiklanilan noktada acilir
- [ ] Terminalin sag alt kosesinde sag tikla → menu ekran disina tasmaz
- [ ] Tab'a sag tikla → tab context menu dogru konumda
- [ ] Sidebar'da sag tikla → workspace context menu dogru konumda

---

## MT-12: Shell Integration Dogrulama

**Neden otomatik degil:** Terminal ici komut ciktisi parse etmek guvenilir degil.

- [ ] Terminal ac (shell integration aktif)
- [ ] `cd /tmp` (veya baska dizin) yaz → CWD guncellenir
- [ ] Split olustur (Ctrl+Shift+D) → yeni pane ayni dizinde acilir
- [ ] `echo $VOIDTERM_SHELL_INTEGRATION` → "1" doner
- [ ] Basarili komut calistir → isCommandRunning durumu dogru
- [ ] Settings → Shell Integration kapat → yeni terminalde CWD takibi calismaz

---

## MT-13: Config Dosyasi Butunlugu

**Neden otomatik degil:** Dosya sistemi durumu ve edge case'ler.

- [ ] Ayarlari cesitli sekillerde degistir (tema, font, profil ekle)
- [ ] Uygulamayi kapat ve tekrar ac → tum ayarlar korunmus
- [ ] Config dosyasini elle boz (gecersiz JSON yap)
- [ ] Uygulamayi ac → hata boundary gorunur veya varsayilanlara doner
- [ ] Config reset yap → tum ayarlar fabrika varsayilanlarina doner

---

## MT-14: Coklu Monitor

**Neden otomatik degil:** Birden fazla monitor gerektirir.

- [ ] Uygulamayi 2. monitore tasi
- [ ] Quake mode ac → pencere 2. monitorde acilir (cursor'un bulundugu ekranda)
- [ ] Pencereyi monitörler arasi tasi → boyut ve konum dogru

---

## MT-15: Kisayol Cakismasi

**Neden otomatik degil:** Interaktif kisayol yakalama mekanizmasi.

- [ ] Settings → Shortcuts → bir kisayolu degistirmeye basla
- [ ] Mevcut baska bir kisayolun tusuna bas → cakisma uyarisi gorunur
- [ ] Farkli bir tus sec → basariyla kaydedilir
- [ ] Yeni kisayolu kullan → dogru calismali
- [ ] "Reset to Defaults" → onay dialogu → tum kisayollar sifirlanir

---

## Sonuclar

| # | Senaryo | Sonuc | Tarih | Notlar |
|---|---------|-------|-------|--------|
| MT-01 | Quake Mode | ☐ Gecti / ☐ Kaldi | | |
| MT-02 | Tab Pin/Unpin | ☐ Gecti / ☐ Kaldi | | |
| MT-03 | Drag & Drop | ☐ Gecti / ☐ Kaldi | | |
| MT-04 | Gorsel Efektler | ☐ Gecti / ☐ Kaldi | | |
| MT-04 | Arkaplan Gorseli | ☐ Gecti / ☐ Kaldi | | |
| MT-05 | Clipboard | ☐ Gecti / ☐ Kaldi | | |
| MT-06 | Bell Sound | ☐ Gecti / ☐ Kaldi | | |
| MT-07 | SSH Baglanti | ☐ Gecti / ☐ Kaldi | | |
| MT-08 | WebGL/Canvas | ☐ Gecti / ☐ Kaldi | | |
| MT-09 | Performans | ☐ Gecti / ☐ Kaldi | | |
| MT-10 | Legacy PowerShell | ☐ Gecti / ☐ Kaldi | | |
| MT-11 | Context Menu Poz. | ☐ Gecti / ☐ Kaldi | | |
| MT-12 | Shell Integration | ☐ Gecti / ☐ Kaldi | | |
| MT-13 | Config Butunlugu | ☐ Gecti / ☐ Kaldi | | |
| MT-14 | Coklu Monitor | ☐ Gecti / ☐ Kaldi | | |
| MT-15 | Kisayol Cakismasi | ☐ Gecti / ☐ Kaldi | | |
