import { useCallback } from 'react'
import { useLanguage } from './useLanguage'

const isLocalized = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && ('es' in value || 'en' in value)

/**
 * Cada feature define sus propios diccionarios y los pasa acá:
 *   const { t, localize } = useTranslation({ es, en })
 *
 * `localize` resuelve valores de datos con forma { es, en }.
 */
export function useTranslation(dictionaries = {}) {
  const { lang } = useLanguage()
  const t = dictionaries[lang] ?? dictionaries.es ?? {}

  const localize = useCallback((value) => (isLocalized(value) ? (value[lang] ?? value.es) : value), [lang])

  return { t, lang, localize }
}
