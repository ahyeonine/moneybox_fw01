import { createContext, useContext, useState, useCallback } from 'react'
import { STRINGS } from './strings.js'

const I18nContext = createContext(null)

const STORAGE_KEY = 'mbox.lang'

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ko' || saved === 'en') return saved
  } catch (e) {
    /* ignore */
  }
  // 외국인 대상 서비스 → 기본 언어는 영어. (저장된 선택이 있으면 그 값을 우선)
  return 'en'
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  const setLang = useCallback((l) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
      document.documentElement.lang = l
    } catch (e) {
      /* ignore */
    }
  }, [])

  const t = useCallback(
    (key) => {
      const entry = STRINGS[key]
      if (!entry) return key
      return entry[lang] ?? entry.en ?? entry.ko ?? key
    },
    [lang]
  )

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
