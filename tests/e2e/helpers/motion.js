// Esperas para la capa de movimiento (Lenis + GSAP ScrollTrigger + three.js).
//
// Contrato de "listo" (src/shared/stage/contract.js): <html data-motion="…">
//   pending  la capa de movimiento está arrancando (Lenis existe y <html class="live"> ya está,
//            pero la escena y los ScrollTrigger todavía no): NO cuenta como listo.
//   ready    Lenis, ScrollTrigger y la escena terminaron (con o sin WebGL).
//   reduced  prefers-reduced-motion: sin Lenis ni pins, página lista.
//   static   la capa de movimiento falló; la página queda completa y estática.
// Solo si la página no tiene el atributo (código viejo) se aceptan las señales del mockup
// (window.__lenis, .live, .gl, .no-gl).
// Con prefers-reduced-motion no se espera a Lenis: alcanza con el DOM, las fuentes y la escena.
// El modo reducido se prueba SOLO con `reducedMotion: 'reduce'` de Playwright (proyectos
// *-reduced), nunca con flags de debug por query string como `?reduced`.
import { test } from '@playwright/test'

export const MOTION_DONE = ['ready', 'reduced', 'static']

const READY_SIGNAL = (done) => {
  const html = document.documentElement
  if (html.hasAttribute('data-motion')) return done.includes(html.dataset.motion)
  if (window.__lenis) return true
  return html.classList.contains('live') || html.classList.contains('gl') || html.classList.contains('no-gl')
}

/**
 * Espera a que la página esté lista para interactuar: React montó el <main>, cargaron las fuentes,
 * la capa de movimiento avisó que arrancó y pasaron dos frames.
 * @param {import('@playwright/test').Page} page
 * @param {{ motion?: 'auto' | 'required' | 'skip', timeout?: number }} [opts]
 *   motion: 'required' (por defecto) falla si data-motion no llega a ready/reduced/static;
 *           'auto' espera la señal pero no falla si no aparece (anota el test); 'skip' no la espera.
 */
export async function waitForAppReady(page, { motion = 'required', timeout = 15_000 } = {}) {
  await page.locator('main').first().waitFor({ state: 'visible', timeout })
  await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true))

  if (motion !== 'skip') {
    try {
      await page.waitForFunction(READY_SIGNAL, MOTION_DONE, { timeout: motion === 'required' ? timeout : 5_000 })
    } catch (err) {
      if (motion === 'required') {
        const state = await page.evaluate(() => document.documentElement.dataset.motion ?? '(sin atributo)')
        throw new Error(`La capa de movimiento no avisó que está lista: data-motion="${state}".`, { cause: err })
      }
      // 'auto': seguimos, pero dejamos constancia en el reporte.
      test.info().annotations.push({ type: 'aviso', description: 'Sin señal de movimiento listo; se siguió igual.' })
    }
  }
  await nextFrames(page, 2)
}

/** Estado de <html data-motion> (o null si no está). */
export function motionState(page) {
  return page.evaluate(() => document.documentElement.getAttribute('data-motion'))
}

/** Devuelve true si Lenis está activo (clase `lenis` que pone Lenis en <html>; __lenis solo en dev). */
export async function hasLenis(page) {
  return page.evaluate(() => !!window.__lenis || document.documentElement.classList.contains('lenis'))
}

/** Devuelve true si la página quedó en modo de movimiento reducido. */
export async function isReducedMode(page) {
  return page.evaluate(() => {
    const html = document.documentElement
    return html.dataset.motion === 'reduced' || html.classList.contains('reduced')
  })
}

/** Espera `n` requestAnimationFrame seguidos. */
export async function nextFrames(page, n = 1) {
  await page.evaluate(
    (count) =>
      new Promise((resolve) => {
        let left = count
        const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
        requestAnimationFrame(tick)
      }),
    n,
  )
}

/**
 * Corta animaciones CSS y transiciones (útil antes de capturas o de axe para que el contraste no
 * se mida a mitad de un fade). No toca GSAP ni Lenis.
 */
// Usa una hoja construible (adoptedStyleSheets) y no un <style> inline: así no choca con la CSP
// del build ni dispara una violación que haría fallar el fixture `cspViolations`.
export async function freezeCssAnimations(page) {
  await page.evaluate(() => {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(
      '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important}',
    )
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]
  })
}

/**
 * Espera a que terminen las animaciones y transiciones CSS (finitas) de `selector` y sus hijos.
 * Usalo antes de axe o de medir colores: a mitad de un fade, axe mide el contraste con opacidad
 * parcial y da falsos positivos.
 * @param {import('@playwright/test').Page} page
 * @param {string} [selector] por defecto, todo el documento
 */
export async function waitForAnimationsToFinish(page, selector = 'html', { timeout = 5_000 } = {}) {
  await page.evaluate(
    ({ selector, timeout }) => {
      const root = document.querySelector(selector)
      if (!root) return null
      const finite = root
        .getAnimations({ subtree: true })
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
      return Promise.race([
        Promise.all(finite.map((a) => a.finished.catch(() => null))),
        new Promise((r) => setTimeout(r, timeout)),
      ])
    },
    { selector, timeout },
  )
  await nextFrames(page, 1)
}
