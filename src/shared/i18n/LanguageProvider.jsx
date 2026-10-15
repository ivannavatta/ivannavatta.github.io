import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANGUAGE, LanguageContext, SUPPORTED_LANGUAGES } from './languageContext'

const STORAGE_KEY = 'portfolio-lang'

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored
  } catch {
    // localStorage puede no estar disponible (modo privado, etc.)
  }
  const browser = navigator.language?.slice(0, 2)
  return SUPPORTED_LANGUAGES.includes(browser) ? browser : DEFAULT_LANGUAGE
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLanguage)

  const setLang = useCallback((next) => {
    if (SUPPORTED_LANGUAGES.includes(next)) setLangState(next)
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((current) => (current === 'es' ? 'en' : 'es'))
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignorar
    }
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, toggleLang }), [lang, setLang, toggleLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
