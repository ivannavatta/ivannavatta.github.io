import { createContext } from 'react'

export const SUPPORTED_LANGUAGES = ['es', 'en']
export const DEFAULT_LANGUAGE = 'es'

export const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  toggleLang: () => {},
})
