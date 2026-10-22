// Contraste de texto medido a mano (WCAG 1.4.3).
//
// Por qué existe: con movimiento, detrás del contenido hay un <canvas> y trazas SVG, y axe marca
// color-contrast como "incomplete" ("contains an image node") en lugar de medirlo. Sin este
// helper, los chequeos de contraste en modo live pasan sin haber medido nada.
//
// Cómo mide: para cada elemento con texto propio, visible y dentro del viewport (debajo de la
// cabecera), toma el color de texto, compone los fondos CSS de sus ancestros (ignora canvas e
// imágenes) y aplica la opacidad acumulada. Umbral 4.5:1, o 3:1 para texto grande
// (≥24 px, o ≥18.66 px en negrita).
import { expect } from '@playwright/test'

// Capas que pueden quedar DETRÁS del texto sin ser ancestros suyos: los bloques de las costuras
// entre capítulos (src/features/stage/engine/seams.js, clase de CSS module "_seam_…").
export const SEAM_BLOCKS = '[class*="_seam_"] > i'

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} rootSelector
 * @param {{ overlays?: string }} [opts] selector de capas que, si se cruzan con el texto, también
 *   cuentan como fondo posible (se toma el peor caso). Por defecto, los bloques de las costuras.
 * @returns {Promise<Array<{ text: string, ratio: number, required: number, fg: string, bg: string }>>}
 */
export function measureTextContrast(page, rootSelector, { overlays = SEAM_BLOCKS } = {}) {
  return page.evaluate(({ rootSelector, overlays }) => {
    const root = document.querySelector(rootSelector)
    if (!root) return []
    const parse = (c) => {
      const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]
      return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }
    }
    const over = (top, bottom) => ({
      r: top.r * top.a + bottom.r * (1 - top.a),
      g: top.g * top.a + bottom.g * (1 - top.a),
      b: top.b * top.a + bottom.b * (1 - top.a),
      a: 1,
    })
    const lum = ({ r, g, b }) => {
      const f = (v) => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    const backgroundOf = (el) => {
      const layers = []
      for (let n = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor)
        if (c.a > 0) layers.push(c)
        if (c.a >= 1) break
      }
      let bg = { r: 255, g: 255, b: 255, a: 1 }
      for (const layer of layers.reverse()) bg = over(layer, bg)
      return bg
    }
    const opacityOf = (el) => {
      let o = 1
      for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity)
      return o
    }
    const overlayBoxes = overlays
      ? [...document.querySelectorAll(overlays)]
          .map((el) => ({ r: el.getBoundingClientRect(), bg: parse(getComputedStyle(el).backgroundColor) }))
          .filter((o) => o.bg.a > 0 && o.r.width > 0 && o.r.height > 0)
      : []
    const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
    const header = document.querySelector('header')
    const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0
    const out = []
    for (const el of root.querySelectorAll('*')) {
      if (el.closest('[aria-hidden="true"]')) continue
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
      if (!ownText) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none') continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.bottom <= headerBottom || r.top >= innerHeight) continue
      const fgRaw = parse(cs.color)
      const opacity = opacityOf(el)
      // Invisible a propósito (p. ej. un caso que todavía no entró en el apilado): no se lee
      if (opacity <= 0.01) continue
      const size = parseFloat(cs.fontSize)
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700)
      const required = large ? 3 : 4.5
      const hex = (c) => `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`
      // Fondo propio y, si una capa (costura) se cruza con la caja del texto, también esa capa
      const candidates = [backgroundOf(el), ...overlayBoxes.filter((o) => intersects(o.r, r)).map((o) => over(o.bg, backgroundOf(el)))]
      let worst = null
      for (const bg of candidates) {
        const fg = over({ ...fgRaw, a: fgRaw.a * opacity }, bg)
        const value = ratio(fg, bg)
        if (!worst || value < worst.value) worst = { value, fg, bg }
      }
      out.push({
        text: el.textContent.trim().slice(0, 30),
        ratio: Math.round(worst.value * 100) / 100,
        required,
        fg: hex(worst.fg),
        bg: hex(worst.bg),
      })
    }
    return out
  }, { rootSelector, overlays })
}

/**
 * Falla si algún texto visible de `rootSelector` queda por debajo de AA.
 * @param {import('@playwright/test').Page} page
 * @param {string} rootSelector
 */
export async function expectReadableContrast(page, rootSelector) {
  const all = await measureTextContrast(page, rootSelector)
  const bad = all.filter((x) => x.ratio < x.required)
  expect(
    bad,
    `Texto con contraste insuficiente en ${rootSelector}:\n` +
      bad.map((x) => `  ${x.ratio}:1 (pide ${x.required}) "${x.text}" ${x.fg} sobre ${x.bg}`).join('\n'),
  ).toEqual([])
  return all
}
