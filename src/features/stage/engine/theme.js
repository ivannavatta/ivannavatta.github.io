// Tema discreto de la cabecera y del navegador.
// Cada sección pinta su propio fondo según data-theme (no hay mezcla global de colores: ver
// globals.css). Acá solo se decide qué tema hay debajo de la cabecera, para que la nav
// (<html data-surface>) y la barra del navegador (meta theme-color) cambien de golpe, nunca
// a mitad de un gris.
import { SURFACE_ATTR, THEMES } from '@/shared/stage'
import { effectiveTheme } from './chapters'
import { cssColor } from './tokens'

const NAV_PROBE = 40 // px desde arriba: lo que está bajo la cabecera
// Redondear como el navegador evita que un borde que "cae justo" en el punto de prueba quede de
// un lado en la pantalla y del otro en la cuenta: las cajas comunes van en unidades de 1/64 px;
// los bloques de la costura son capas compuestas (will-change) y quedan alineados al px entero
// (medido también con DPR 2).
const snap = (v) => Math.round(v * 64) / 64

export function createSurfaceTracker() {
  const root = document.documentElement
  const meta = document.querySelector('meta[name="theme-color"]')
  const initialMeta = meta?.content
  const hex = { [THEMES.light]: cssColor('--light-bg'), [THEMES.dark]: cssColor('--dark-bg') }
  let last = ''
  let seamEdge = () => null

  /**
   * La región con tema más interna que contiene el punto de prueba (p. ej. el marco del inicio).
   * Una sección con costura empieza donde empieza su costura (un módulo antes): ahí ya se ve su color.
   */
  function themeUnderHeader() {
    const x = window.innerWidth / 2
    let theme = THEMES.light
    for (const el of document.querySelectorAll('main [data-theme]')) {
      const r = el.getBoundingClientRect()
      const edge = seamEdge(el)
      const top = edge === null ? snap(r.top) : Math.round(edge)
      if (top <= NAV_PROBE && snap(r.bottom) > NAV_PROBE && r.left <= x && r.right >= x) theme = effectiveTheme(el)
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

  /** fn(section) → tope visible de su costura en px, o null (lo da la capa de costuras). */
  function setSeamEdge(fn) {
    seamEdge = fn
  }

  return { sync, setSeamEdge, dispose }
}
