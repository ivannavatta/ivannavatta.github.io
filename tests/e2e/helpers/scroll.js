// Scroll "real" con la rueda del mouse (mouse.wheel), para que se disparen los mismos eventos
// que usa la lógica de la nav (dirección de scroll) y que Lenis intercepta.
// Con Lenis el scroll es suavizado: después de la rueda esperamos a que scrollY se quede quieto.

/**
 * Espera a que window.scrollY no cambie (más de `epsilon` px por frame) durante `stableFrames`
 * frames seguidos.
 * @param {import('@playwright/test').Page} page
 * @param {{ stableFrames?: number, epsilon?: number, timeout?: number }} [opts]
 * @returns {Promise<number>} scrollY final
 */
export async function waitForScrollSettled(page, { stableFrames = 8, epsilon = 0.5, timeout = 4_000 } = {}) {
  return page.evaluate(
    ({ stableFrames, epsilon, timeout }) =>
      new Promise((resolve) => {
        const start = performance.now()
        let last = window.scrollY
        let still = 0
        const tick = () => {
          const y = window.scrollY
          still = Math.abs(y - last) < epsilon ? still + 1 : 0
          last = y
          if (still >= stableFrames || performance.now() - start > timeout) resolve(y)
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
    { stableFrames, epsilon, timeout },
  )
}

/** Pone el mouse en el centro del viewport (la rueda actúa donde está el puntero). */
async function pointerToCenter(page) {
  const vp = page.viewportSize() ?? { width: 1280, height: 720 }
  await page.mouse.move(Math.round(vp.width / 2), Math.round(vp.height / 2))
}

/**
 * Hace scroll con la rueda en pasos chicos (como una rueda real) y espera a que se asiente.
 * deltaY positivo baja, negativo sube.
 *
 * Los deltas son píxeles CSS en todos los proyectos: con deviceScaleFactor 2 (proyecto mobile),
 * Chromium entrega a la página `WheelEvent.deltaY` dividido por el devicePixelRatio (400 → 200),
 * así que acá se compensa multiplicando por el DPR.
 * @param {import('@playwright/test').Page} page
 * @param {number} deltaY total en píxeles CSS
 * @param {{ step?: number, settle?: boolean }} [opts]
 * @returns {Promise<number>} scrollY final
 */
export async function wheelScroll(page, deltaY, { step = 120, settle = true } = {}) {
  await pointerToCenter(page)
  const dpr = await page.evaluate(() => window.devicePixelRatio || 1)
  const dir = Math.sign(deltaY)
  let left = Math.abs(deltaY)
  while (left > 0) {
    const d = Math.min(step, left)
    await page.mouse.wheel(0, d * dir * dpr)
    left -= d
  }
  return settle ? waitForScrollSettled(page) : page.evaluate(() => window.scrollY)
}

/**
 * Baja (o sube) con la rueda hasta que `locator` tenga el borde superior dentro de la franja
 * [0, maxTop] del viewport. Sirve con secciones fijadas (pin) donde el scroll no es lineal.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} locator
 * @param {{ maxTop?: number, step?: number, maxSteps?: number }} [opts]
 */
export async function wheelUntilInView(page, locator, { maxTop = 0.35, step = 400, maxSteps = 60 } = {}) {
  const vh = page.viewportSize()?.height ?? 800
  for (let i = 0; i < maxSteps; i++) {
    const box = await locator.boundingBox()
    if (box && box.y >= -1 && box.y <= vh * maxTop) return
    const delta = !box || box.y > 0 ? step : -step
    await wheelScroll(page, delta)
  }
  throw new Error(`No se llegó a ver el elemento con la rueda después de ${maxSteps} pasos.`)
}

/**
 * Baja con la rueda hasta el final de la página. Entre pasos espera poco (Lenis todavía puede
 * estar frenando); al final espera a que el scroll quede quieto del todo.
 */
export async function wheelToBottom(page, { step = 800, maxSteps = 80 } = {}) {
  let prev = -1
  for (let i = 0; i < maxSteps; i++) {
    await wheelScroll(page, step, { step: 400, settle: false })
    const y = await waitForScrollSettled(page, { stableFrames: 3, epsilon: 3 })
    const atBottom = await page.evaluate(
      () => Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 4,
    )
    if (atBottom || Math.abs(y - prev) < 1) return waitForScrollSettled(page)
    prev = y
  }
  throw new Error('No se llegó al final de la página con la rueda.')
}

/**
 * Salto programático e instantáneo (sin rueda) a un selector o a una posición. Usa Lenis si existe
 * para no desincronizarlo. Para preparar el estado de un test, no para probar la nav.
 * @param {import('@playwright/test').Page} page
 * @param {string | number} target selector CSS (ej. '#contacto') o scrollY en píxeles
 */
export async function jumpTo(page, target) {
  await page.evaluate((t) => {
    const lenis = window.__lenis
    const el = typeof t === 'string' ? document.querySelector(t) : null
    if (typeof t === 'string' && !el) throw new Error(`jumpTo: no existe ${t}`)
    if (lenis?.scrollTo) lenis.scrollTo(el ?? t, { immediate: true, force: true })
    else if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
    else window.scrollTo({ top: t, behavior: 'instant' })
  }, target)
  return waitForScrollSettled(page)
}

/** scrollY actual. */
export function scrollY(page) {
  return page.evaluate(() => window.scrollY)
}
