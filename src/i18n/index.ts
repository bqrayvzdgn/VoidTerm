import { create } from 'zustand'
import { tr } from './locales/tr'
import { en } from './locales/en'

export type Language = 'tr' | 'en'
export type TranslationKeys = typeof tr

const translations: Record<Language, TranslationKeys> = { tr, en }

interface I18nStore {
  language: Language
  t: TranslationKeys
  setLanguage: (lang: Language) => void
}

// Tarayici dilini al veya varsayilan olarak Turkce kullan
const getDefaultLanguage = (): Language => {
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0]
    if (browserLang === 'tr' || browserLang === 'en') {
      return browserLang as Language
    }
  }
  return 'tr'
}

export const useI18n = create<I18nStore>((set) => ({
  language: getDefaultLanguage(),
  t: translations[getDefaultLanguage()],
  setLanguage: (lang: Language) => {
    set({ language: lang, t: translations[lang] })
    // Dil tercihini localStorage'a kaydet
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('voidterm-language', lang)
    }
  }
}))

// Kaydedilmis dil tercihini yukle
if (typeof localStorage !== 'undefined') {
  const savedLang = localStorage.getItem('voidterm-language') as Language | null
  if (savedLang && (savedLang === 'tr' || savedLang === 'en')) {
    useI18n.getState().setLanguage(savedLang)
  }
}

// Kisa erisim icin t fonksiyonu
export const useTranslation = () => {
  const { t, language, setLanguage } = useI18n()
  return { t, language, setLanguage }
}
