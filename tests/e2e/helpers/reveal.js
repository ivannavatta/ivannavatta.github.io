// Helpers para useRevealOnOpen (src/features/projects/hooks): al abrir la terminal "Probar en vivo"
// o el panel "Ver arquitectura", si no se ven enteros, la página se desplaza lo justo para mostrarlos
// (como scrollIntoView({ block: 'nearest' })), debajo de la barra fija.
import { expect } from './fixtures.js'
import { jumpTo } from './scroll.js'

/**
 * Deja el borde de arriba de `locator` a la altura `frac` del viewport (0 arriba, 1 abajo), con un
 * salto instantáneo. Devuelve la caja resultante (para comprobar que quedó donde se pidió).
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} locator
 * @param {number} frac
 */
export async function placeAt(page, locator, frac) {
  const y = await locator.evaluate((el, f) => Math.round(el.getBoundingClientRect().top + scrollY - innerHeight * f), frac)
  await jumpTo(page, Math.max(0, y))
  return locator.boundingBox()
}

/**
 * Empieza a anotar window.scrollY en cada cuadro (window.__e2eScrollTrace), hasta `ms`
 * milisegundos. Sirve para saber si la página se movió y si lo hizo con animación o de un salto.
 * @param {import('@playwright/test').Page} page
 * @param {number} [ms]
 */
export async function startScrollTrace(page, ms = 4_000) {
  await page.evaluate((ms) => {
    const trace = [Math.round(scrollY * 10) / 10]
    window.__e2eScrollTrace = trace
    const end = performance.now() + ms
    const tick = () => {
      trace.push(Math.round(scrollY * 10) / 10)
      if (performance.now() < end && window.__e2eScrollTrace === trace) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, ms)
}

/**
 * Lo anotado por startScrollTrace: valor inicial, final, cuánto se apartó del inicial y cuántos
 * valores intermedios distintos hubo (0 = salto sin animación).
 * @param {import('@playwright/test').Page} page
 */
export function scrollTrace(page) {
  return page.evaluate(() => {
    const t = window.__e2eScrollTrace ?? []
    const from = t[0]
    const to = t.at(-1)
    const steps = new Set(t.filter((y) => Math.abs(y - from) > 1 && Math.abs(y - to) > 1)).size
    return { from, to, maxDrift: Math.max(0, ...t.map((y) => Math.abs(y - from))), steps, frames: t.length }
  })
}

/**
 * Caja de `locator` respecto de la pantalla y de la barra fija (la cabecera, si se ve: en tablet se
 * oculta al bajar). `entire` = entera en pantalla y sin quedar debajo de la barra.
 * @param {import('@playwright/test').Locator} locator
 */
export function viewportFit(locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const h = document.querySelector('header')?.getBoundingClientRect()
    const bar = h && h.bottom > 0 ? Math.round(h.bottom) : 0
    const top = Math.round(r.top)
    const bottom = Math.round(r.bottom)
    return { top, bottom, bar, vh: innerHeight, entire: top >= bar && top >= 0 && bottom <= innerHeight }
  })
}

/**
 * Espera a que `locator` quede entero en pantalla y debajo de la barra fija, con el scroll quieto.
 * @param {import('@playwright/test').Locator} locator
 * @param {string} what
 */
export async function expectRevealed(locator, what) {
  await expect(locator, `${what}: entero en el viewport`).toBeInViewport({ ratio: 1 })
  await expect
    .poll(() => viewportFit(locator), { message: `${what}: entero y debajo de la barra fija` })
    .toMatchObject({ entire: true })
}
