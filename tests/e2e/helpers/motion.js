// Esperas para la capa de movimiento (Lenis + GSAP ScrollTrigger + three.js).
//
// Contrato de "listo" que busca el helper (cualquiera alcanza; el primero es el recomendado):
//   1. <html data-motion="ready">  (o "reduced" / "static" cuando no hay movimiento)
//   2. window.__lenis definido (lo expone el mockup)
//   3. <html class="live">   (movimiento completo inicializado, como en el mockup)
//   4. <html class="gl"> o <html class="no-gl"> (la escena 3D terminó de decidir si dibuja)
// Con prefers-reduced-motion no se espera a Lenis: alcanza con el DOM, las fuentes y la escena.
// El modo reducido se prueba SOLO con `reducedMotion: 'reduce'` de Playwright (proyectos
// *-reduced), nunca con flags de debug por query string como `?reduced`.
import { test } from '@playwright/test'

const READY_SIGNAL = () => {
  const html = document.documentElement
  const m = html.dataset.motion
  if (m === 'ready' || m === 'reduced' || m === 'static') return true
  if (window.__lenis) return true
  return html.classList.contains('live') || html.classList.contains('gl') || html.classList.contains('no-gl')
}

/**
 * Espera a que la página esté lista para interactuar: React montó el <main>, cargaron las fuentes,
 * la capa de movimiento avisó que arrancó y pasaron dos frames.
 * @param {import('@playwright/test').Page} page
 * @param {{ motion?: 'auto' | 'required' | 'skip', timeout?: number }} [opts]
 *   motion: 'auto' (por defecto) espera la señal pero no falla si no aparece (anota el test);
 *           'required' falla si no aparece; 'skip' no la espera.
 */
export async function waitForAppReady(page, { motion = 'auto', timeout = 10_000 } = {}) {
  await page.locator('main').first().waitFor({ state: 'visible', timeout })
  await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true))

  if (motion !== 'skip') {
    try {
      await page.waitForFunction(READY_SIGNAL, null, { timeout: motion === 'required' ? timeout : 5_000 })
    } catch (err) {
      if (motion === 'required') throw new Error('La capa de movimiento no avisó que está lista (data-motion / __lenis / .live / .gl).', { cause: err })
      // 'auto': seguimos, pero dejamos constancia en el reporte.
      test.info().annotations.push({ type: 'aviso', description: 'Sin señal de movimiento listo; se siguió igual.' })
    }
  }
  await nextFrames(page, 2)
}

/** Devuelve true si Lenis está activo en la página. */
export async function hasLenis(page) {
  return page.evaluate(() => !!window.__lenis || document.documentElement.classList.contains('lenis'))
}

/** Devuelve true si la página quedó en modo de movimiento reducido. */
export async function isReducedMode(page) {
  return page.evaluate(() => {
    const html = document.documentElement
    return (
      html.dataset.motion === 'reduced' ||
      html.classList.contains('reduced') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
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
