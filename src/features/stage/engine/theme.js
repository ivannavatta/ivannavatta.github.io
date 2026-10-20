// Tema por capítulo. Con escena viva, el fondo y el texto son globales y se mezclan con el
// scroll (variables CSS vivas en <html>). La cabecera recibe aparte un tema discreto
// (<html data-surface>) que cambia de golpe a mitad de la mezcla: nunca queda texto y
// fondo parecidos en un mismo cuadro.
import { SURFACE_ATTR, THEMES, selectors } from '@/shared/stage'
import { clamp01, easeInOut, lerp } from './math'
import { cssColor, hexToRgb } from './tokens'

const VARS = ['bg', 'surface', 'surface-2', 'ink', 'soft', 'accent', 'accent-ink', 'accent-hover', 'error']
const MIX_WINDOW = 0.28 // fracción de pantalla que dura cada mezcla
const STOP_LINE = 0.55 // el capítulo toma el tema cuando su borde cruza el 55 % de la pantalla
const NAV_PROBE = 40 // px desde arriba: el capítulo que está bajo la cabecera


function readThemes() {
  const out = {}
  for (const theme of Object.values(THEMES)) {
    out[theme] = {}
    for (const name of VARS) out[theme][name] = hexToRgb(cssColor(`--${theme}-${name}`))
  }
  return out
}

function setSurface(theme) {
  const root = document.documentElement
  if (root.getAttribute(SURFACE_ATTR) !== theme) root.setAttribute(SURFACE_ATTR, theme)
}

function themeMeta() {
  return document.querySelector('meta[name="theme-color"]')
}

/**
 * Mezcla viva. getHeroBackdrop() → { y, theme } | null: dónde aparece el fondo detrás del
 * inicio cuando se encoge (lo calcula stage con el pin del inicio).
 */
export function createThemeMixer({ getHeroBackdrop }) {
  const rgb = readThemes()
  const hex = { light: cssColor('--light-bg'), dark: cssColor('--dark-bg') }
  const meta = themeMeta()
  const initialMeta = meta?.content
  let stops = []
  let lastKey = ''

  function buildStops() {
    const vh = window.innerHeight
    const sections = Array.from(document.querySelectorAll(selectors.chapters))
    const list = []
    sections.forEach((el, i) => {
      const theme = el.dataset.theme || THEMES.light
      if (i === 0) {
        list.push({ y: 0, theme })
        const backdrop = getHeroBackdrop()
        if (backdrop) list.push(backdrop)
        return
      }
      list.push({ y: el.getBoundingClientRect().top + window.scrollY - vh * STOP_LINE, theme })
    })
    list.sort((a, b) => a.y - b.y)
    // Solo cuentan los cambios de tema
    stops = list.filter((s, i) => i === 0 || s.theme !== list[i - 1].theme)
    lastKey = ''
  }

  function apply(y) {
    if (!stops.length) return
    const win = window.innerHeight * MIX_WINDOW
    let from = stops[0].theme
    let to = from
    let t = 0
    for (let i = 1; i < stops.length; i++) {
      const s = stops[i]
      if (y >= s.y + win / 2) {
        from = s.theme
        to = s.theme
        t = 0
        continue
      }
      if (y > s.y - win / 2) {
        to = s.theme
        t = (y - (s.y - win / 2)) / win
      }
      break
    }
    const key = from + to + t.toFixed(3)
    if (key === lastKey) return
    lastKey = key
    const e = easeInOut(clamp01(t))
    setSurface(e < 0.5 ? from : to)
    const style = document.documentElement.style
    for (const name of VARS) {
      const a = rgb[from][name]
      const b = rgb[to][name]
      style.setProperty(
        `--${name}`,
        `rgb(${Math.round(lerp(a[0], b[0], e))} ${Math.round(lerp(a[1], b[1], e))} ${Math.round(lerp(a[2], b[2], e))})`,
      )
    }
    if (meta) meta.content = e > 0.5 ? hex[to] : hex[from]
  }

  function dispose() {
    const root = document.documentElement
    for (const name of VARS) root.style.removeProperty(`--${name}`)
    root.removeAttribute(SURFACE_ATTR)
    if (meta && initialMeta) meta.content = initialMeta
  }

  return { buildStops, apply, dispose }
}

/** Sin escena viva: el tema de la cabecera es el del capítulo que tiene debajo. */
export function syncSurfaceFromSections() {
  for (const el of document.querySelectorAll(selectors.chapters)) {
    const r = el.getBoundingClientRect()
    if (r.top <= NAV_PROBE && r.bottom > NAV_PROBE) {
      setSurface(el.dataset.theme || THEMES.light)
      return
    }
  }
}

export function clearSurface() {
  document.documentElement.removeAttribute(SURFACE_ATTR)
}
