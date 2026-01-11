export const tr = {
  common: {
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    add: 'Ekle',
    close: 'Kapat',
    reset: 'Sıfırla',
    export: 'Dışa Aktar',
    import: 'İçe Aktar',
    confirm: 'Onayla',
    yes: 'Evet',
    no: 'Hayır',
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    warning: 'Uyarı'
  },
  
  app: {
    title: 'VoidTerm',
    noTerminal: 'Terminal açık değil',
    useQuickStart: 'Hızlı Başlat kullanın veya Ctrl+T basın',
    loadingConfig: 'Yapılandırma yükleniyor...'
  },
  
  settings: {
    title: 'Ayarlar',
    
    tabs: {
      appearance: 'Görünüm',
      terminal: 'Terminal',
      shortcuts: 'Kısayollar',
      profiles: 'Profiller',
      backup: 'Yedekleme',
      about: 'Hakkında'
    },
    
    appearance: {
      title: 'Görünüm Ayarları',
      theme: 'Tema',
      fontFamily: 'Yazı Tipi',
      fontSize: 'Yazı Boyutu',
      lineHeight: 'Satır Yüksekliği',
      letterSpacing: 'Harf Aralığı',
      cursorStyle: 'İmleç Stili',
      cursorBlink: 'İmleç Yanıp Sönsün',
      windowEffects: 'Pencere Efektleri',
      opacity: 'Saydamlık',
      blur: 'Bulanıklık Efekti',
      backgroundImage: 'Arkaplan Resmi',
      backgroundImagePlaceholder: 'Dosya yolu veya URL',
      customThemes: 'Özel Temalar',
      importTheme: 'Tema İçe Aktar',
      exportTheme: 'Dışa Aktar',
      deleteTheme: 'Sil',
      themeImportSuccess: 'Tema başarıyla içe aktarıldı!',
      themeImportError: 'Tema içe aktarılamadı',
      themeDeleteConfirm: 'Bu özel tema silinsin mi?',
      noCustomThemes: 'Özel tema yok. Eklemek için bir tema dosyası içe aktarın.',
      builtInThemes: 'Yerleşik Temalar',
      customThemesList: 'Özel Temalar'
    },
    
    terminal: {
      title: 'Terminal Ayarları',
      defaultProfile: 'Varsayılan Profil',
      scrollback: 'Kaydırma Geçmişi',
      copyOnSelect: 'Seçince Kopyala',
      bellSound: 'Bip Sesi'
    },
    
    shortcuts: {
      title: 'Klavye Kısayolları',
      newTab: 'Yeni Sekme',
      closeTab: 'Sekmeyi Kapat',
      closePane: 'Paneli Kapat',
      splitVertical: 'Dikey Böl',
      splitHorizontal: 'Yatay Böl',
      toggleSidebar: 'Kenar Çubuğu',
      openSettings: 'Ayarlar',
      nextTab: 'Sonraki Sekme',
      prevTab: 'Önceki Sekme',
      focusLeft: 'Sol Panele Odaklan',
      focusRight: 'Sağ Panele Odaklan',
      focusUp: 'Üst Panele Odaklan',
      focusDown: 'Alt Panele Odaklan',
      toggleSearch: 'Aramayı Aç/Kapat',
      clearTerminal: 'Terminali Temizle',
      copyText: 'Kopyala',
      pasteText: 'Yapıştır',
      openCommandPalette: 'Komut Paleti',
      openSSHManager: 'SSH Yöneticisi',
      resetToDefault: 'Varsayılana Sıfırla',
      pressKeys: 'Tuş kombinasyonu...',
      resetConfirm: 'Klavye kısayolları varsayılana sıfırlanacak. Devam etmek istiyor musunuz?',
      conflictWarning: 'Bu kısayol zaten kullanımda:',
      categorySections: 'Sekmeler',
      categoryPanes: 'Paneller',
      categoryNavigation: 'Gezinme',
      categoryTerminal: 'Terminal',
      categoryGeneral: 'Genel'
    },
    
    profiles: {
      title: 'Profil Yönetimi',
      newProfile: 'Yeni Profil',
      addProfile: 'Profil Ekle',
      editProfile: 'Profili Düzenle',
      name: 'Ad',
      namePlaceholder: 'Profil adı',
      icon: 'Simge',
      iconPlaceholder: 'Simge (max 4 karakter)',
      color: 'Renk',
      shell: 'Kabuk',
      shellPlaceholder: 'örn: cmd.exe, powershell.exe',
      arguments: 'Argümanlar',
      argumentsPlaceholder: 'örn: /k claude',
      workingDirectory: 'Çalışma Dizini',
      workingDirectoryPlaceholder: 'örn: C:\\Users\\user\\projects',
      envVariables: 'Ortam Değişkenleri',
      envVariablesPlaceholder: 'KEY=value (her satırda bir tane)',
      startupCommand: 'Başlangıç Komutu',
      startupCommandPlaceholder: 'örn: cls && echo Welcome!',
      deleteConfirm: 'Bu profili silmek istediğinizden emin misiniz?',
      minProfileError: 'En az bir profil olmalı!'
    },
    
    backup: {
      title: 'Yedekleme ve Geri Yükleme',
      exportTitle: 'Tüm Ayarları Dışa Aktar',
      exportDescription: 'Tüm ayarlarınızı ve profil yapılandırmalarınızı JSON dosyası olarak dışa aktarın.',
      exportButton: 'Ayarları Dışa Aktar',
      importTitle: 'Tüm Ayarları İçe Aktar',
      importDescription: 'Daha önce dışa aktarılmış ayarları geri yükleyin.',
      importButton: 'Ayarları İçe Aktar',
      importSuccess: 'Ayarlar başarıyla içe aktarıldı!',
      importError: 'Dosya okunamadı: Geçerli bir JSON dosyası olduğundan emin olun.',
      exportProfilesTitle: 'Sadece Profilleri Dışa Aktar',
      exportProfilesDescription: 'Terminal profillerinizi ayrı bir dosya olarak dışa aktarın.',
      exportProfilesButton: 'Profilleri Dışa Aktar',
      importProfilesTitle: 'Sadece Profilleri İçe Aktar',
      importProfilesDescription: 'Daha önce dışa aktarılmış profilleri geri yükleyin.',
      importProfilesButton: 'Profilleri İçe Aktar',
      profileImportSuccess: 'Profiller başarıyla içe aktarıldı!',
      profileImportCount: 'profil içe aktarıldı',
      resetTitle: 'Sıfırla',
      resetDescription: 'Tüm ayarları varsayılan değerlere döndürün.',
      resetButton: 'Varsayılana Sıfırla',
      resetConfirm: 'Tüm ayarlar varsayılana sıfırlanacak. Devam etmek istiyor musunuz?'
    },
    
    about: {
      title: 'Hakkında',
      version: 'Versiyon',
      description: 'Modern, hızlı ve özelleştirilebilir bir terminal emülatörü. Electron, React ve xterm.js ile oluşturuldu.',
      github: 'GitHub'
    }
  },
  
  sidebar: {
    workspaces: 'Çalışma Alanları',
    newWorkspace: 'Yeni Çalışma Alanı',
    quickStart: 'Hızlı Başlat',
    settings: 'Ayarlar',
    rename: 'Yeniden Adlandır',
    delete: 'Sil',
    deleteConfirm: 'Bu çalışma alanını silmek istediğinizden emin misiniz?'
  },
  
  tabbar: {
    newTab: 'Yeni Sekme',
    closeTab: 'Sekmeyi Kapat',
    closeOthers: 'Diğerlerini Kapat',
    closeAll: 'Tümünü Kapat',
    duplicate: 'Çoğalt',
    createGroup: 'Grup Oluştur',
    addToGroup: 'Gruba Ekle',
    removeFromGroup: 'Gruptan Çıkar',
    renameGroup: 'Grubu Yeniden Adlandır',
    deleteGroup: 'Grubu Sil',
    ungroupAll: 'Tüm Sekmeleri Gruptan Çıkar',
    newGroup: 'Yeni Grup',
    groupName: 'Grup Adı',
    noGroups: 'Henüz grup yok'
  },
  
  terminal: {
    search: 'Ara',
    searchPlaceholder: 'Ara...',
    noResults: 'Sonuç yok',
    copied: 'Kopyalandı!',
    copy: 'Kopyala',
    paste: 'Yapıştır',
    clear: 'Temizle',
    selectAll: 'Tümünü Seç'
  },
  
  ssh: {
    title: 'SSH Bağlantıları',
    newConnection: 'Bağlantı Ekle',
    name: 'Ad',
    host: 'Sunucu',
    port: 'Port',
    username: 'Kullanıcı Adı',
    authentication: 'Kimlik Doğrulama',
    privateKey: 'Özel Anahtar',
    privateKeyPath: 'Özel Anahtar Yolu',
    sshAgent: 'SSH Agent',
    password: 'Şifre (önerilmez)',
    jumpHost: 'Jump Host (opsiyonel)',
    jumpHostPlaceholder: 'user@jumphost.com',
    connect: 'Bağlan',
    noConnections: 'Kayıtlı SSH bağlantısı yok',
    addConnectionHint: 'Bağlantı eklemek için "Bağlantı Ekle" butonuna tıklayın'
  },
  
  commandPalette: {
    placeholder: 'Komut ara...',
    newTab: 'Yeni Sekme',
    closeTab: 'Sekmeyi Kapat',
    splitVertical: 'Dikey Böl',
    splitHorizontal: 'Yatay Böl',
    closePane: 'Paneli Kapat',
    toggleSidebar: 'Kenar Çubuğunu Aç/Kapat',
    openSettings: 'Ayarları Aç',
    nextTab: 'Sonraki Sekme',
    prevTab: 'Önceki Sekme',
    openSSH: 'SSH Yöneticisini Aç'
  },
  
  errors: {
    generic: 'Bir hata oluştu',
    terminalCreate: 'Terminal oluşturulamadı',
    configLoad: 'Yapılandırma yüklenemedi',
    profileSave: 'Profil kaydedilemedi',
    sshConnect: 'SSH bağlantısı başarısız',
    invalidInput: 'Geçersiz giriş'
  },
  
  snippets: {
    title: 'Snippet\'ler',
    addSnippet: 'Snippet Ekle',
    editSnippet: 'Snippet Düzenle',
    deleteSnippet: 'Snippet Sil',
    deleteConfirm: 'Bu snippet\'i silmek istediğinizden emin misiniz?',
    name: 'Ad',
    namePlaceholder: 'Snippet adı',
    command: 'Komut',
    commandPlaceholder: 'Çalıştırılacak komut',
    description: 'Açıklama',
    descriptionPlaceholder: 'İsteğe bağlı açıklama',
    category: 'Kategori',
    shortcut: 'Kısayol',
    shortcutPlaceholder: 'Örn: Ctrl+Shift+1',
    noSnippets: 'Henüz snippet yok',
    addSnippetHint: 'Sık kullandığınız komutları snippet olarak kaydedin',
    run: 'Çalıştır',
    usageCount: 'kullanım',
    export: 'Snippet\'leri Dışa Aktar',
    import: 'Snippet\'leri İçe Aktar',
    importSuccess: 'Snippet\'ler başarıyla içe aktarıldı',
    importError: 'Snippet\'ler içe aktarılamadı',
    searchPlaceholder: 'Snippet ara...',
    allCategories: 'Tüm Kategoriler',
    addCategory: 'Kategori Ekle',
    newCategoryPlaceholder: 'Yeni kategori adı'
  },
  
  errorBoundary: {
    title: 'Bir şeyler yanlış gitti',
    message: 'Beklenmeyen bir hata oluştu',
    reload: 'Uygulamayı Yeniden Yükle',
    tryAgain: 'Tekrar Dene',
    resetConfig: 'Yapılandırmayı Sıfırla',
    copyError: 'Hata Detaylarını Kopyala',
    errorCopied: 'Hata detayları panoya kopyalandı',
    errorDetails: 'Hata Detayları (hata ayıklama için)',
    errorReport: 'VoidTerm Hata Raporu'
  },
  
  toast: {
    settingsExported: 'Ayarlar dışa aktarıldı',
    settingsImported: 'Ayarlar içe aktarıldı',
    profilesExported: 'Profiller dışa aktarıldı',
    profilesImported: 'profil içe aktarıldı',
    snippetsExported: 'Snippet\'ler dışa aktarıldı',
    snippetsImported: 'Snippet\'ler içe aktarıldı',
    settingsReset: 'Ayarlar sıfırlandı',
    copiedToClipboard: 'Panoya kopyalandı',
    terminalCreated: 'Terminal oluşturuldu',
    terminalClosed: 'Terminal kapatıldı',
    connectionFailed: 'Bağlantı başarısız',
    connectionSuccess: 'Bağlantı başarılı',
    invalidFile: 'Geçersiz dosya formatı',
    operationFailed: 'İşlem başarısız'
  }
}

export type TranslationKeys = typeof tr
