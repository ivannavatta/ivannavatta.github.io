// Chequeos de layout: overflow horizontal y elementos que se salen del viewport.
import { expect } from '@playwright/test'

/**
 * Falla si la página tiene scroll horizontal. Si falla, lista los elementos que se salen del ancho
 * del viewport y que no están recortados por un ancestro con overflow hidden/clip, para encontrar
 * rápido al culpable.
 * @param {import('@playwright/test').Page} page
 * @param {{ tolerance?: number }} [opts] píxeles de tolerancia (redondeos de subpíxel)
 */
export async function expectNoHorizontalOverflow(page, { tolerance = 1 } = {}) {
  const report = await page.evaluate((tol) => {
    const doc = document.documentElement
    const vw = doc.clientWidth
    const scrollWidth = Math.max(doc.scrollWidth, document.body?.scrollWidth ?? 0)
    // Probamos si realmente se puede desplazar en X (overflow-x: clip/hidden lo impide).
    const prevX = window.scrollX
    window.scrollTo({ left: 99999, top: window.scrollY, behavior: 'instant' })
    const canScrollX = window.scrollX > tol
    window.scrollTo({ left: prevX, top: window.scrollY, behavior: 'instant' })

    const clipped = (el) => {
      for (let p = el.parentElement; p && p !== doc; p = p.parentElement) {
        const s = getComputedStyle(p)
        if (/(hidden|clip)/.test(s.overflowX) || s.contain.includes('paint')) {
          const r = p.getBoundingClientRect()
          if (r.right <= vw + tol) return true
        }
      }
      return false
    }
    const describe = (el) => {
      const id = el.id ? `#${el.id}` : ''
      const cls = typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : ''
      return `${el.tagName.toLowerCase()}${id}${cls}`
    }
    const offenders = []
    if (scrollWidth > vw + tol || canScrollX) {
      for (const el of document.body.querySelectorAll('*')) {
        const s = getComputedStyle(el)
        if (s.display === 'none' || s.position === 'fixed') continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue
        if ((r.right > vw + tol || r.left < -tol) && !clipped(el)) {
          offenders.push(`${describe(el)} (left ${Math.round(r.left)}, right ${Math.round(r.right)})`)
          if (offenders.length >= 12) break
        }
      }
    }
    return { vw, scrollWidth, canScrollX, offenders }
  }, tolerance)

  const msg =
    `Overflow horizontal: viewport ${report.vw}px, scrollWidth ${report.scrollWidth}px, ` +
    `scroll X posible: ${report.canScrollX}.\nElementos que se salen:\n  ${report.offenders.join('\n  ') || '(ninguno detectado)'}`
  expect(report.canScrollX, msg).toBe(false)
  expect(report.scrollWidth, msg).toBeLessThanOrEqual(report.vw + tolerance)
}

/**
 * Falla si el elemento está cortado por los bordes laterales del viewport.
 * @param {import('@playwright/test').Locator} locator
 */
export async function expectWithinViewportX(locator, { tolerance = 1 } = {}) {
  const page = locator.page()
  const vw = (await page.evaluate(() => document.documentElement.clientWidth))
  const box = await locator.boundingBox()
  expect(box, 'El elemento no tiene caja (no está visible)').not.toBeNull()
  expect(box.x, 'Se sale por la izquierda').toBeGreaterThanOrEqual(-tolerance)
  expect(box.x + box.width, 'Se sale por la derecha').toBeLessThanOrEqual(vw + tolerance)
}

/**
 * Falla si el tamaño de toque es menor a min x min (WCAG 2.5.8 pide 24px; recomendamos 44px en mobile).
 * @param {import('@playwright/test').Locator} locator
 */
export async function expectTargetSize(locator, min = 24) {
  const box = await locator.boundingBox()
  expect(box, 'El control no tiene caja (no está visible)').not.toBeNull()
  expect(Math.min(box.width, box.height), `Área táctil menor a ${min}px`).toBeGreaterThanOrEqual(min)
}

/**
 * Busca bloques de texto de `rootSelector` que estén en pantalla pero tapados por otra cosa (el
 * punto central de su caja no lo recibe el propio elemento). Ignora lo que queda debajo de la
 * cabecera fija y lo que está fuera de pantalla. Devuelve la lista de tapados (vacía si está todo
 * bien).
 * @param {import('@playwright/test').Page} page
 * @param {string} rootSelector ej. '#perfil'
 * @param {{ selector?: string }} [opts] qué elementos revisar (por defecto, bloques de texto)
 */
export function findCoveredContent(page, rootSelector, { selector = 'h1, h2, h3, p, dt, dd, li > a, a, button' } = {}) {
  return page.evaluate(
    ({ rootSelector, selector }) => {
      const root = document.querySelector(rootSelector)
      if (!root) return [`no existe ${rootSelector}`]
      const header = document.querySelector('header')
      const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0
      const covered = []
      for (const el of root.querySelectorAll(selector)) {
        if (el.closest('[aria-hidden="true"]')) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        const cx = r.left + r.width / 2
        const cy = r.top + Math.min(r.height / 2, 12)
        if (cy <= headerBottom + 2 || cy >= innerHeight - 2 || cx <= 0 || cx >= innerWidth) continue
        const top = document.elementFromPoint(cx, cy)
        if (!top || el.contains(top)) continue
        const cls = typeof top.className === 'string' ? top.className.split(/\s+/).slice(0, 2).join('.') : ''
        covered.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}" tapado por <${top.tagName.toLowerCase()} class="${cls}">`)
      }
      return covered
    },
    { rootSelector, selector },
  )
}
