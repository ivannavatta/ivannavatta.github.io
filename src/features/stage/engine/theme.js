// Tema discreto de la cabecera y del navegador.
// Cada sección pinta su propio fondo según data-theme (no hay mezcla global de colores: ver
// globals.css). Acá solo se decide qué tema hay debajo de la cabecera, para que la nav
// (<html data-surface>) y la barra del navegador (meta theme-color) cambien de golpe, nunca
// a mitad de un gris.
import { ROOT_CLASS, SURFACE_ATTR, THEMES } from '@/shared/stage'
import { cssColor } from './tokens'

const NAV_PROBE = 40 // px desde arriba: lo que está bajo la cabecera

/**
 * Tema efectivo de una región: con escena viva, una sección con data-backdrop muestra ese
 * fondo detrás de su contenido (el inicio, oscuro detrás del marco que se encoge).
 */
export function effectiveTheme(el) {
  const live = document.documentElement.classList.contains(ROOT_CLASS.live)
  return (live && el.dataset.backdrop) || el.dataset.theme || THEMES.light
}

export function createSurfaceTracker() {
  const root = document.documentElement
  const meta = document.querySelector('meta[name="theme-color"]')
  const initialMeta = meta?.content
  const hex = { [THEMES.light]: cssColor('--light-bg'), [THEMES.dark]: cssColor('--dark-bg') }
  let last = ''

  /** La región con tema más interna que contiene el punto de prueba (p. ej. el marco del inicio). */
  function themeUnderHeader() {
    const x = window.innerWidth / 2
    let theme = THEMES.light
    for (const el of document.querySelectorAll('main [data-theme]')) {
      const r = el.getBoundingClientRect()
      if (r.top <= NAV_PROBE && r.bottom > NAV_PROBE && r.left <= x && r.right >= x) theme = effectiveTheme(el)
    }
    return theme
  }

  function sync() {
    const theme = themeUnderHeader()
    if (theme === last) return
    last = theme
    root.setAttribute(SURFACE_ATTR, theme)
    if (meta) meta.content = hex[theme]
  }

  function dispose() {
    root.removeAttribute(SURFACE_ATTR)
    if (meta && initialMeta) meta.content = initialMeta
  }

  return { sync, dispose }
}
