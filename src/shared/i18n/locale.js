/**
 * Idioma del sitio. Hoy el diseño aprobado está solo en español, sin selector.
 * Cada feature guarda su copia en i18n/es.js y la elige con pickCopy:
 *
 *   import * as es from './i18n/es'
 *   const copy = pickCopy({ es })
 *
 * Para sumar inglés: agregar i18n/en.js en cada feature, pasarlo a pickCopy({ es, en })
 * y decidir el idioma (por ejemplo con <html lang> o una ruta /en). Nada más cambia.
 */
export const DEFAULT_LOCALE = 'es'

export function currentLocale() {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : ''
  return (lang || DEFAULT_LOCALE).slice(0, 2)
}

export function pickCopy(dictionaries, locale = currentLocale()) {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE]
}
