# VoidTerm - Manuel Test Senaryolari

> Tarih: 2026-03-15 | Surum: 1.0.2

---

## TC-01: Terminal Yaşam Döngüsü

### TC-01.1: Yeni terminal oluşturma
| Adim | Beklenen Sonuc |
|------|----------------|
| Ctrl+T'ye bas | Create Dialog acilir |
| Varsayilan profili sec | Yeni tab olusur, terminal prompt gosterir |
| Tab basliginda profil adi gorunur | ✓ |
| Pencere basligi "ProfilAdi - VoidTerm" olur | ✓ |

### TC-01.2: Profil dropdown ile terminal oluşturma
| Adim | Beklenen Sonuc |
|------|----------------|
| Tab bar'daki + butonunun yanindaki dropdown'a tikla | Profil listesi acilir |
| Farkli bir profil sec | O profille yeni terminal acilir |
| Tab basliginda secilen profil adi gorunur | ✓ |

### TC-01.3: Terminal kapatma
| Adim | Beklenen Sonuc |
|------|----------------|
| Birden fazla tab ac | Tab bar'da 2+ tab gorunur |
| Tab uzerindeki X butonuna tikla | Tab kapanir, bir onceki tab aktif olur |
| Ctrl+W ile tab kapat | Ayni davranis |
| Orta tus (middle-click) ile tab kapat | Ayni davranis |

### TC-01.4: Son tab kapatma davranışı
| Adim | Beklenen Sonuc |
|------|----------------|
| Tek bir tab kalacak sekilde diger tablari kapat | Tek tab kalir |
| Son tab'i kapatmayi dene (Ctrl+W veya X) | "Close VoidTerm?" exit dialog acilir |
| Cancel'a tikla | Dialog kapanir, terminal acik kalir |
| Tekrar kapatmayi dene, Close'a tikla | Uygulama kapanir |

### TC-01.5: Kapatılan tab'ı yeniden açma
| Adim | Beklenen Sonuc |
|------|----------------|
| 2-3 tab ac, not al (profil, workspace) | |
| Bir tab'i kapat | Tab kapanir |
| Ctrl+Shift+T'ye bas | Kapatilan tab ayni profil ve workspace ile yeniden acilir |
| 10'dan fazla tab kapat, Ctrl+Shift+T ile geri ac | En fazla 10 tab geri gelir |

---

## TC-02: Tab Yönetimi

### TC-02.1: Tab sıralama (drag & drop)
| Adim | Beklenen Sonuc |
|------|----------------|
| 3+ tab ac | Tab bar'da 3+ tab gorunur |
| Bir tab'i surukleyip baska bir konuma birak | Tab yeni konumuna tasiyip yerlesir |
| Pinli tab'i suruklemeyi dene | Pinli tablar daima basta kalir |

### TC-02.2: Tab sabitleme (pin)
| Adim | Beklenen Sonuc |
|------|----------------|
| Tab'a sag tikla | Context menu acilir |
| "Pin Tab" sec | Tab pinlenir, pin ikonu gorunur, X butonu kalkar |
| Pinli tab daima tab bar'in basinda yer alir | ✓ |
| Tekrar sag tikla, "Unpin Tab" sec | Pin kalkar, X butonu geri gelir |

### TC-02.3: Tab renklendirme
| Adim | Beklenen Sonuc |
|------|----------------|
| Tab'a sag tikla → renk seceneklerini gor | 9 renk secenegi + "Clear" gorulur |
| Bir renk sec (ornegin kirmizi) | Tab'in altinda renkli cizgi belirir |
| "Clear" sec | Renk kalkar |

### TC-02.4: Tab'ı workspace'e taşıma
| Adim | Beklenen Sonuc |
|------|----------------|
| Bir workspace olustur | Workspace sidebar'da gorunur |
| Tab'a sag tikla → "Move to Workspace" → workspace sec | Tab o workspace'e tasinir |
| O workspace'e gec | Tasinan tab gorunur |
| "No Workspace" sec | Tab workspace'den cikarilir |

### TC-02.5: Tab navigasyonu
| Adim | Beklenen Sonuc |
|------|----------------|
| 3+ tab ac | |
| Ctrl+Tab'a bas | Sonraki tab'a gecer |
| Ctrl+Shift+Tab'a bas | Onceki tab'a gecer |
| Son tab'dayken Ctrl+Tab | Ilk tab'a doner (wrap) |
| Tab'a tikla | O tab aktif olur |

### TC-02.6: Tab scroll (overflow)
| Adim | Beklenen Sonuc |
|------|----------------|
| Tab bar'a sigmayacak kadar cok tab ac (8-10+) | Scroll oklari gorunur |
| Sol/sag oklara tikla | Tab bar kaydirilir |
| Mouse wheel ile kaydirmayi dene | Tab bar kaydirilir |

---

## TC-03: Split Pane Sistemi

### TC-03.1: Dikey bölme
| Adim | Beklenen Sonuc |
|------|----------------|
| Bir terminal ac | Tek pane gorunur |
| Ctrl+Shift+D'ye bas | Terminal dikey olarak ikiye bolunur (yan yana) |
| Her iki panelde de bagimsiz terminal calışır | ✓ |
| Yeni pane'in CWD'si parent ile ayni | ✓ |

### TC-03.2: Yatay bölme
| Adim | Beklenen Sonuc |
|------|----------------|
| Ctrl+Shift+E'ye bas | Terminal yatay olarak ikiye bolunur (ust uste) |
| Her iki panelde de bagimsiz terminal calisir | ✓ |

### TC-03.3: Pane boyutlandırma
| Adim | Beklenen Sonuc |
|------|----------------|
| Bir split olustur | Divider cizgisi gorunur |
| Divider'i surukle | Paneler boyut degistirir |
| 100px minimumun altina surulemeyi dene | Minimum boyutta durur |
| Divider'a cift tikla | 50/50 oranina doner |

### TC-03.4: Pane navigasyonu
| Adim | Beklenen Sonuc |
|------|----------------|
| 2x2 layout olustur | 4 pane gorunur |
| Alt+Sol ok | Soldaki pane'e odaklanir |
| Alt+Sag ok | Sagdaki pane'e odaklanir |
| Alt+Yukari ok | Ustteki pane'e odaklanir |
| Alt+Asagi ok | Alttaki pane'e odaklanir |
| Bir pane'e tikla | O pane aktif olur (border/highlight degisir) |

### TC-03.5: Pane kapatma
| Adim | Beklenen Sonuc |
|------|----------------|
| Split olustur (2 pane) | |
| Ctrl+Shift+W ile aktif pane'i kapat | Pane kapanir, diger pane tam boyuta gecer |
| Tek pane kaldiginda Ctrl+Shift+W | Tab kapanir |

### TC-03.6: İç içe split (nested)
| Adim | Beklenen Sonuc |
|------|----------------|
| Dikey split olustur | 2 pane |
| Sol pane'de yatay split olustur | Sol tarafta 2 pane (ust/alt), sag tarafta 1 pane |
| Tum paneler bagimsiz calisir | ✓ |
| Her pane'e navigasyon calısır | ✓ |

### TC-03.7: Layout şablonları
| Adim | Beklenen Sonuc |
|------|----------------|
| Tab bar'daki split ikonuna tikla | Layout menu acilir |
| "1x2" sec | 2 pane yan yana olusur |
| "2x2" sec | 4 pane grid olarak olusur |
| "Reset (1x1)" sec | Tek pane'e doner |
| "1x3" sec | 3 pane yan yana olusur |
| "3x1" sec | 3 pane ust uste olusur |

---

## TC-04: Workspace Sistemi

### TC-04.1: Workspace oluşturma
| Adim | Beklenen Sonuc |
|------|----------------|
| Ctrl+T → Create Dialog'da "Workspace" sec | Workspace isim alani gorunur |
| Isim gir ve onayla | Sidebar'da yeni workspace gorunur, otomatik renk atanir |

### TC-04.2: Workspace yeniden adlandırma
| Adim | Beklenen Sonuc |
|------|----------------|
| Sidebar'da workspace'e sag tikla | Context menu acilir |
| "Rename" sec | Isim duzenlenebilir hale gelir |
| Yeni isim gir, Enter'a bas | Isim guncellenir |

### TC-04.3: Workspace silme
| Adim | Beklenen Sonuc |
|------|----------------|
| Ici dolu bir workspace olustur (tab'lar ekle) | |
| Workspace'e sag tikla → "Delete" | Workspace silinir |
| Icindeki tab'lar "No Workspace"a tasinir | ✓ |

### TC-04.4: Workspace geçişi
| Adim | Beklenen Sonuc |
|------|----------------|
| 2 workspace olustur, her birine farkli tab'lar ekle | |
| Sidebar'dan Workspace A'ya tikla | Workspace A'nin tab'lari gorunur |
| Workspace B'ye tikla | Workspace B'nin tab'lari gorunur |
| Aktif tab otomatik olarak workspace'in ilk tab'ina gecer | ✓ |

### TC-04.5: Sidebar açma/kapama
| Adim | Beklenen Sonuc |
|------|----------------|
| Ctrl+Shift+B'ye bas | Sidebar acilir |
| Tekrar Ctrl+Shift+B'ye bas | Sidebar kapanir |
| Terminal alani sidebar durumuna gore boyut ayarlar | ✓ |

---

## TC-05: Arama (Search)

### TC-05.1: Temel arama
| Adim | Beklenen Sonuc |
|------|----------------|
| Terminalde birkac komut calistir | Cikti olusur |
| Ctrl+F'e bas | Search bar acilir |
| Bir kelime yaz | Eslesme sayisi gorunur, eslesmeler vurgulanir |
| Sonraki/onceki esleme butonlari ile gezin | Siradaki eslemeye atlar |
| Escape veya X ile kapat | Search bar kapanir |

### TC-05.2: Regex arama
| Adim | Beklenen Sonuc |
|------|----------------|
| Search bar'i ac (Ctrl+F) | |
| Regex modunu aktif et | Regex toggle butonu aktif olur |
| `\d+` gibi bir regex gir | Sayilarla eslenir |
| Gecersiz regex gir (ornegin `[`) | 0 eslesme gosterir, hata vermez |

### TC-05.3: Büyük/küçük harf duyarlılığı
| Adim | Beklenen Sonuc |
|------|----------------|
| Case-sensitive modunu kapat | "error" ve "Error" ikisi de eslesir |
| Case-sensitive modunu ac | Sadece tam eslesme bulunur |

---

## TC-06: Kopyalama & Yapıştırma

### TC-06.1: Klavye kısayolları
| Adim | Beklenen Sonuc |
|------|----------------|
| Terminalde bir metin sec (mouse ile surukleme) | Metin seçilir/vurgulanir |
| Ctrl+Shift+C'ye bas | Metin panoya kopyalanir |
| Ctrl+Shift+V'ye bas | Pano icerigi terminale yapıştirilir |

### TC-06.2: Sağ tık menüsü
| Adim | Beklenen Sonuc |
|------|----------------|
| Terminalde metin sec, sag tikla | Context menu acilir, "Copy" aktif |
| Copy sec | Metin kopyalanir |
| Secim yokken sag tikla | "Copy" deaktif gorunur |
| Paste sec | Yapistirilir |

### TC-06.3: Copy on Select
| Adim | Beklenen Sonuc |
|------|----------------|
| Settings → Terminal → "Copy on Select" ac | |
| Terminalde metin sec | Otomatik olarak panoya kopyalanir |
| Baska yere yapistirarak dogrula | ✓ |

---

## TC-07: Zoom

### TC-07.1: Yakınlaştırma/uzaklaştırma
| Adim | Beklenen Sonuc |
|------|----------------|
| Ctrl++ veya Ctrl+= bas | Font boyutu artar |
| Ctrl+- bas | Font boyutu azalir |
| Ctrl+0 bas | Font boyutu varsayilana doner |
| Minimum boyuta kadar kucultulen dene | 8px'de durur |
| Split pane'lerde zoom | Tum paneler ayni zoom seviyesinde olur |

---

## TC-08: Ayarlar (Settings)

### TC-08.1: Görünüm ayarları
| Adim | Beklenen Sonuc |
|------|----------------|
| Ctrl+, ile Settings ac | Settings modal acilir |
| Tema degistir (Dark ↔ Light) | Aninda uygulanir |
| Font ailesini degistir | Terminal fontu degisir |
| Font boyutunu degistir (8-32) | Terminal font boyutu degisir |
| Satir yuksekligini degistir | Terminal satir araligi degisir |
| Cursor stilini degistir (block/underline/bar) | Cursor sekli degisir |
| Cursor blink'i ac/kapa | Cursor yanip sonme durumu degisir |

### TC-08.2: Opacity ve blur
| Adim | Beklenen Sonuc |
|------|----------------|
| Opacity slider'ini 0.7'ye cek | Pencere yari saydam olur |
| Blur'u aktif et | Arka plan bulaniklasir (Win11 Mica/Acrylic) |
| Opacity'yi 1'e geri al | Pencere opak olur |

### TC-08.3: Arkaplan görseli
| Adim | Beklenen Sonuc |
|------|----------------|
| "Select Background Image" butonuna tikla | Dosya secim dialogu acilir |
| Bir PNG/JPG sec | Gorsel terminal arkasinda gorunur |
| Opacity slider'i ile gorsel saydamligini ayarla | Gorsel saydamligi degisir |
| Blur slider'i ile gorsel bulanikligi ayarla | Gorsel bulaniklasir |
| "Clear" butonu ile gorseli kaldir | Gorsel kalkar |

### TC-08.4: Terminal ayarları
| Adim | Beklenen Sonuc |
|------|----------------|
| Varsayilan profili degistir | Yeni tab'lar secilen profille acilir |
| Terminal padding'i degistir | Terminal ic boslugu degisir |
| Scrollback degerini degistir | Terminal tampon boyutu degisir |
| Bell sound'u ac/kapa | Bell davranisi degisir |

### TC-08.5: Quake Mode
| Adim | Beklenen Sonuc |
|------|----------------|
| Settings → Terminal → Quake Mode'u ac | Quake ayarlari gorunur |
| Kisayol ata (varsayilan Ctrl+\`) | |
| Settings'i kapat | |
| Atanan kisayola bas | Pencere ekranin ustunden kayar (quake tarzı) |
| Tekrar bas | Pencere gizlenir |
| Quake modundayken pencere disina tikla | Pencere gizlenir |
| Quake yukseklik yuzdesini ayarla | Quake pencere yuksekligi degisir |

### TC-08.6: Kısayol ayarları
| Adim | Beklenen Sonuc |
|------|----------------|
| Settings → Shortcuts sekmesine git | Tum kisayollar kategorilere ayrilmis gorunur |
| Bir kisayola tikla | Duzenleme modu aktif olur |
| Yeni tus kombinasyonuna bas | Kisayol guncellenir |
| Mevcut bir kisayolla cakisan tus gir | Cakisma uyarisi gorunur |
| "Reset to Defaults" butonuna tikla | Onay sorulur, onaylarsan tum kisayollar sifirlanir |

### TC-08.7: Hakkında (About)
| Adim | Beklenen Sonuc |
|------|----------------|
| Settings → About sekmesine git | Uygulama bilgileri gorunur |
| Electron, Node, Chrome surumlerini dogrula | Surum bilgileri dogru gorunur |
| GitHub linkine tikla | Tarayicide proje sayfasi acilir |

---

## TC-09: Profil Yönetimi

### TC-09.1: Yeni profil oluşturma (local)
| Adim | Beklenen Sonuc |
|------|----------------|
| Settings → Profiles → "New Profile" | Profil formu acilir |
| Ad, shell yolu, icon, renk gir | |
| Kaydet | Profil listede gorunur |
| Yeni tab acarken profil seceneklerde gorunur | ✓ |

### TC-09.2: SSH profili oluşturma
| Adim | Beklenen Sonuc |
|------|----------------|
| Yeni profil → Type: SSH sec | SSH alanlari gorunur (Host, Port, Username, Auth) |
| SSH bilgilerini gir | |
| Kaydet | Profil listede "SSH" olarak gorunur |
| Bu profille terminal ac | SSH baglantisi baslatilir |

### TC-09.3: Profil düzenleme
| Adim | Beklenen Sonuc |
|------|----------------|
| Mevcut bir profili sec | Form dolu gelir |
| Ismi degistir, kaydet | Profil adi guncellenir |
| Acik terminallerin tab'lari etkilenmez | ✓ |

### TC-09.4: Profil silme
| Adim | Beklenen Sonuc |
|------|----------------|
| 2+ profil varken birini sil | Profil listeden kalkar |
| Son profili silmeyi dene | Uyari gosterilir, silinmez |

---

## TC-10: Command Palette

### TC-10.1: Açma/kapama
| Adim | Beklenen Sonuc |
|------|----------------|
| Ctrl+Shift+P'ye bas | Command palette acilir, input odakli |
| Escape'e bas | Kapanir |
| Overlay'e tikla | Kapanir |

### TC-10.2: Komut arama ve çalıştırma
| Adim | Beklenen Sonuc |
|------|----------------|
| Palette'i ac | Tum komutlar listelenir |
| "split" yaz | Sadece split ile ilgili komutlar filtrelenir |
| Ok tuslari ile gezin | Secili komut vurgulanir |
| Enter'a bas | Komut calistirilir, palette kapanir |
| Profil ismi yaz | Profil ile yeni terminal komutu gorunur |

---

## TC-11: Pencere Kontrolleri

### TC-11.1: Minimize/Maximize/Close
| Adim | Beklenen Sonuc |
|------|----------------|
| Minimize butonuna tikla | Pencere gorev cubuguna iner |
| Maximize butonuna tikla | Pencere tam ekran olur |
| Tekrar maximize butonuna tikla | Pencere onceki boyutuna doner |
| Pencere basligini surukle | Pencere tasinir |

### TC-11.2: Pencere başlığı
| Adim | Beklenen Sonuc |
|------|----------------|
| Farkli tab'lara gec | Pencere basligi "TabAdi - VoidTerm" olarak guncellenir |
| Tum tab'lari kapat | Baslik "VoidTerm" olur |

---

## TC-12: Shell Integration (OSC 633)

### TC-12.1: CWD takibi
| Adim | Beklenen Sonuc |
|------|----------------|
| Terminal ac (shell integration aktif) | |
| `cd /tmp` veya baska dizine gec | CWD guncellenir |
| Split olustur (Ctrl+Shift+D) | Yeni pane ayni dizinde acilir |

### TC-12.2: Komut takibi
| Adim | Beklenen Sonuc |
|------|----------------|
| Basarili bir komut calistir (`echo hello`) | Exit code 0 raporlanir |
| Basarisiz komut calistir (`false`) | Exit code 0 disinda raporlanir |

### TC-12.3: Shell integration kapatma
| Adim | Beklenen Sonuc |
|------|----------------|
| Settings → Terminal → Shell Integration'i kapat | |
| Yeni terminal ac | OSC 633 sequence'leri gonderilmez |
| CWD takibi calismaz | ✓ |

---

## TC-13: Error Boundary

### TC-13.1: Panel hatası kurtarma
| Adim | Beklenen Sonuc |
|------|----------------|
| Bir panel hataya duserse (render error) | Hata mesaji gorunur, diger paneller calisir |
| "Try Again" butonuna tikla | Panel yeniden yuklenir |
| "Reload Application" butonuna tikla | Uygulama yeniden baslar |
| "Reset Configuration" butonuna tikla | Ayarlar sifirlanir, uygulama yeniden baslar |

---

## TC-14: Toast Bildirimleri

### TC-14.1: Bildirim türleri
| Adim | Beklenen Sonuc |
|------|----------------|
| Profil olustur | Basari (yesil) toast gorunur |
| Gecersiz islem yap | Hata (kirmizi) toast gorunur |
| Toast otomatik kaybolur | Timeout sonrasi kaybolur |
| X butonuna tikla | Toast hemen kapanir |
| Birden fazla toast tetikle | Toast'lar ust uste yigilir |

---

## TC-15: Konfigürasyon

### TC-15.1: Config Import/Export
| Adim | Beklenen Sonuc |
|------|----------------|
| Config export et | JSON string doner |
| Ayarlari degistir | |
| Export edilen config'i import et | Eski ayarlar geri yuklenir |

### TC-15.2: Config sıfırlama
| Adim | Beklenen Sonuc |
|------|----------------|
| Ayarlari cesitli sekillerde degistir | |
| Config reset yap | Tum ayarlar fabrika varsayilanlarina doner |

---

## TC-16: Platform Spesifik

### TC-16.1: Windows özellikleri
| Adim | Beklenen Sonuc |
|------|----------------|
| Windows 11'de calistir | Mica material arka plan calısır |
| Blur efektini ac | Acrylic efekti uygulanir |
| PowerShell varsayilan shell olarak calisir | ✓ |
| Legacy PowerShell'de mavi arka plan sorunu yok | ResetColor uygulanir |
| Pencere ikonu gorev cubugunda gorunur (icon.ico) | ✓ |

### TC-16.2: Context menu pozisyonu
| Adim | Beklenen Sonuc |
|------|----------------|
| Terminalin farkli bolgelerinde sag tikla | Menu her zaman tiklanilan noktada acilir |
| Ekranin kenarinda sag tikla | Menu ekran disina tasmaz |

---

## TC-17: Performans

### TC-17.1: Çoklu terminal
| Adim | Beklenen Sonuc |
|------|----------------|
| 5+ tab ac | UI akici kalir |
| Her tab'da komut calistir | Tab gecisleri hizli |
| Bellek kullanimi makul kalir | Task Manager'dan dogrula |

### TC-17.2: Büyük çıktı
| Adim | Beklenen Sonuc |
|------|----------------|
| Buyuk dosya cat/type et (10K+ satir) | Terminal donmaz |
| Scrollback calisir | Yukari kaydirma mumkun |
| Arama bu buffer'da calisir | Eslesme bulunur |

### TC-17.3: WebGL renderer
| Adim | Beklenen Sonuc |
|------|----------------|
| Terminal acarken WebGL aktif olur | Performansli render |
| WebGL desteklenmeyen ortamda | Canvas fallback devreye girer |

---

## TC-18: Güvenlik

### TC-18.1: Ortam değişkeni izolasyonu
| Adim | Beklenen Sonuc |
|------|----------------|
| Hassas env var (API_KEY vb.) tanimla | |
| Terminal ac, env/set ile degiskenleri listele | Whitelist disindaki degiskenler terminal'e geçmez |
| VOIDTERM=1 ve TERM=xterm-256color mevcut | ✓ |

### TC-18.2: URL doğrulama
| Adim | Beklenen Sonuc |
|------|----------------|
| Terminalde https:// ile baslayan URL tikla | Tarayicide acilir |
| javascript: veya file: protokolu dene | Engellenir, acilmaz |

### TC-18.3: SSH enjeksiyon koruması
| Adim | Beklenen Sonuc |
|------|----------------|
| SSH profilinde host'a `; rm -rf /` gir | Hata verir, komut calistirilmaz |
| Metacharacter iceren username dene | Reddedilir |
