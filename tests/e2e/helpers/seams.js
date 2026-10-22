// Costuras entre capítulos (src/features/stage/engine/seams.js) y tema de la cabecera.
//
// Los bloques de las costuras tienen pointer-events: none, así que elementFromPoint no los ve.
// Para saber si un bloque queda ENCIMA de un texto, se les activa el hit-testing un instante
// (CSSOM, sin violar la CSP) y se restaura enseguida.
import { SEAM_BLOCKS } from './contrast.js'

/**
 * Textos visibles de `roots` que tienen un bloque de costura encima (en su centro o en sus
 * esquinas). Devuelve la lista de tapados.
 * @param {import('@playwright/test').Page} page
 * @param {string[]} roots ej. ['#perfil', '#proyectos']
 */
export function findTextUnderSeams(page, roots) {
  return page.evaluate(
    ({ roots, blocksSel }) => {
      const blocks = [...document.querySelectorAll(blocksSel)]
      const layer = blocks[0]?.parentElement?.parentElement
      if (!layer) return []
      const prev = layer.style.pointerEvents
      layer.style.pointerEvents = 'auto'
      blocks.forEach((b) => (b.style.pointerEvents = 'auto'))
      const header = document.querySelector('header')
      const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0
      const covered = []
      try {
        for (const sel of roots) {
          const root = document.querySelector(sel)
          if (!root) continue
          for (const el of root.querySelectorAll('h1, h2, h3, h4, p, dt, dd, li, a, button, figcaption, pre')) {
            if (el.closest('[aria-hidden="true"]')) continue
            const r = el.getBoundingClientRect()
            if (r.width === 0 || r.bottom <= headerBottom || r.top >= innerHeight) continue
            const pts = [
              [r.left + r.width / 2, r.top + r.height / 2],
              [r.left + 2, r.top + 2],
              [r.right - 2, r.bottom - 2],
            ].filter(([, y]) => y > headerBottom && y < innerHeight)
            const hit = pts.some(([x, y]) => blocks.includes(document.elementFromPoint(x, y)))
            if (hit) covered.push(`${sel} ${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}"`)
          }
        }
      } finally {
        blocks.forEach((b) => (b.style.pointerEvents = ''))
        layer.style.pointerEvents = prev
      }
      return covered
    },
    { roots, blocksSel: SEAM_BLOCKS },
  )
}

/**
 * Tema real bajo la cabecera, medido por color: el fondo de la primera REGIÓN con tema que hay
 * debajo del punto (centro, 40 px): una sección o un marco con data-theme, o un bloque de costura.
 * Las tarjetas y superficies internas no cuentan (theme-color es el fondo de la región).
 * Devuelve también lo que declara la página: <html data-surface> y meta theme-color.
 * @param {import('@playwright/test').Page} page
 */
export function surfaceUnderHeader(page, { probeY = 40 } = {}) {
  return page.evaluate(
    ({ probeY, blocksSel }) => {
      const blocks = [...document.querySelectorAll(blocksSel)]
      const layer = blocks[0]?.parentElement?.parentElement
      if (layer) {
        layer.style.pointerEvents = 'auto'
        blocks.forEach((b) => (b.style.pointerEvents = 'auto'))
      }
      const parse = (c) => c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]
      let color = null
      try {
        const header = document.querySelector('header')
        for (const el of document.elementsFromPoint(innerWidth / 2, probeY)) {
          if (header?.contains(el) || el.closest('canvas, svg')) continue
          if (!el.matches('main [data-theme]') && !blocks.includes(el)) continue
          const c = parse(getComputedStyle(el).backgroundColor)
          if ((c.length > 3 ? c[3] : 1) >= 0.99) {
            color = c.slice(0, 3)
            break
          }
        }
      } finally {
        if (layer) {
          blocks.forEach((b) => (b.style.pointerEvents = ''))
          layer.style.pointerEvents = ''
        }
      }
      const lum = color ? (0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]) / 255 : 1
      const meta = document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null
      const toRgb = (hex) => {
        if (!hex || !hex.startsWith('#')) return null
        const h = hex.length === 4 ? hex.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : hex
        return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
      }
      return {
        actual: lum > 0.5 ? 'light' : 'dark',
        actualColor: color ? `rgb(${color.join(',')})` : null,
        surface: document.documentElement.getAttribute('data-surface'),
        themeColor: meta,
        themeColorMatches: !!color && JSON.stringify(toRgb(meta)) === JSON.stringify(color.map(Math.round)),
        scrollY: Math.round(scrollY),
      }
    },
    { probeY, blocksSel: SEAM_BLOCKS },
  )
}

/**
 * Posiciones de scroll para barrer el borde superior de la sección `id`: desde que el borde
 * aparece por el pie de la pantalla hasta que pasa por debajo de la cabecera.
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 * @param {{ step?: number, fromFrac?: number, toFrac?: number }} [opts] fracciones de pantalla
 */
export async function borderSweep(page, id, { step = 20, fromFrac = 1.0, toFrac = 0.0 } = {}) {
  const { top, vh } = await page.evaluate(
    (id) => ({ top: document.getElementById(id).getBoundingClientRect().top + scrollY, vh: innerHeight }),
    id,
  )
  const ys = []
  for (let y = Math.round(top - fromFrac * vh); y <= Math.round(top - toFrac * vh); y += step) ys.push(Math.max(0, y))
  return ys
}
