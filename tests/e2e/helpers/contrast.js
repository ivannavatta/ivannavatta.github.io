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

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} rootSelector
 * @returns {Promise<Array<{ text: string, ratio: number, required: number, fg: string, bg: string }>>}
 */
export function measureTextContrast(page, rootSelector) {
  return page.evaluate((rootSelector) => {
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
      const bg = backgroundOf(el)
      const fgRaw = parse(cs.color)
      const fg = over({ ...fgRaw, a: fgRaw.a * opacityOf(el) }, bg)
      const size = parseFloat(cs.fontSize)
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700)
      const required = large ? 3 : 4.5
      const value = ratio(fg, bg)
      const hex = (c) => `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`
      out.push({ text: el.textContent.trim().slice(0, 30), ratio: Math.round(value * 100) / 100, required, fg: hex(fg), bg: hex(bg) })
    }
    return out
  }, rootSelector)
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
