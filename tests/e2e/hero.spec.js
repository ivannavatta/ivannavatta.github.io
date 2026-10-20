// Inicio (#inicio): src/features/hero.
//
// Un solo h1 "Ivan Navatta", propuesta de valor, CTAs "Ver proyectos" (→ #proyectos, foco en su h2)
// y "Descargar CV" (/cv.pdf con download). Con movimiento: pin + scrub (el marco se encoge, cruzan
// las filas decorativas y aparece la firma del IN) que se libera al bajar con la rueda. Con
// movimiento reducido: sin pin, sin filas y sin firma. Errores de consola y CSP: fixtures automáticos.
import {
  test,
  expect,
  waitForAppReady,
  waitForAnimationsToFinish,
  wheelScroll,
  wheelUntilInView,
  waitForScrollSettled,
  jumpTo,
  scrollY,
  expectNoHorizontalOverflow,
  expectNoA11yViolations,
  expectReadableContrast,
  expectTargetSize,
  expectVisibleFocus,
  tabUntilFocused,
} from './helpers/index.js'

const isReducedProject = () => test.info().project.use.reducedMotion === 'reduce'

/** @param {import('@playwright/test').Page} page */
function hero(page) {
  const section = page.locator('#inicio')
  return {
    section,
    h1: page.getByRole('heading', { level: 1, name: 'Ivan Navatta', exact: true }),
    projects: section.getByRole('link', { name: 'Ver proyectos', exact: true }),
    cv: section.getByRole('link', { name: /^Descargar CV/ }),
    /** Elemento fijado por GSAP (el hijo directo del pin-spacer), o null sin pin. */
    pinned: section.locator('.pin-spacer > *').first(),
    perfilH2: page.getByRole('heading', { level: 2, name: 'Negocio, datos y código.' }),
  }
}

/**
 * ¿El punto central de `locator` lo recibe el propio elemento? (no lo tapa nada que capture el
 * puntero). Devuelve 'ok', 'offscreen' o una descripción del que lo tapa.
 */
function hitTest(locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect()
    if (r.bottom <= 0 || r.top >= innerHeight || r.width === 0) return 'offscreen'
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    if (el.contains(top)) return 'ok'
    if (!top) return 'null'
    const cls = typeof top.className === 'string' ? top.className.split(/\s+/).slice(0, 2).join('.') : ''
    return `tapado por <${top.tagName.toLowerCase()} class="${cls}">`
  })
}

/** Escala actual del marco (transform del contenedor del h1 dentro del pin). */
const frameScale = (page) =>
  page.evaluate(() => {
    const frame = document.querySelector('#hero-title')?.closest('#inicio [class*="frame"]')
    const m = frame ? getComputedStyle(frame).transform : 'none'
    return m === 'none' ? 1 : new DOMMatrix(m).a
  })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)
})

test('un solo h1 y el inicio expone solo su contenido (la decoración no entra al árbol)', async ({ page }) => {
  const h = hero(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(h.h1).toBeVisible()
  // Las filas "Negocio · Datos · Código" / "Pieza por pieza", el IN y las trazas no aparecen
  await expect(h.section).toMatchAriaSnapshot(`
    - region "Ivan Navatta":
      - paragraph: Desarrollo software de punta a punta, de la base de datos a la interfaz, empezando por lo que necesita el negocio.
      - paragraph: Desarrollador · Estudiante de la Lic. en Gestión de la Tecnología de la Información (UADE) · Buenos Aires
      - link "Ver proyectos"
      - link /^Descargar CV/
      - heading "Ivan Navatta" [level=1]
  `)
})

test('filas, IN, firma, trazas y canvas tienen aria-hidden y nada enfocable adentro', async ({ page }) => {
  const report = await page.evaluate(() => {
    const hero = document.getElementById('inicio')
    const decor = [
      ...hero.querySelectorAll('svg, [data-stage-pose]'),
      ...[...hero.querySelectorAll('p')].filter((p) => /Pieza por pieza|Negocio · Datos · Código/.test(p.textContent)),
      ...document.querySelectorAll('canvas'),
    ]
    const exposed = decor
      .filter((el) => !el.closest('[aria-hidden="true"]'))
      .map((el) => `${el.tagName.toLowerCase()}${el.dataset.stagePose ? `[pose=${el.dataset.stagePose}]` : ''}`)
    const focusableInHidden = [...hero.querySelectorAll('[aria-hidden="true"] :is(a[href], button, [tabindex]:not([tabindex="-1"]))')].length
    return { count: decor.length, exposed, focusableInHidden }
  })
  expect(report.count, 'no se encontró la decoración del inicio').toBeGreaterThan(0)
  expect(report.exposed, 'decoración expuesta a lectores de pantalla').toEqual([])
  expect(report.focusableInHidden).toBe(0)
})

test('"Ver proyectos" lleva a #proyectos y deja el foco en su h2', async ({ page }) => {
  const h = hero(page)
  await h.projects.click()
  const target = page.getByRole('heading', { level: 2, name: 'Proyectos', exact: true })
  await expect(target).toBeFocused()
  await waitForScrollSettled(page)
  await expect(target).toBeInViewport()
})

test('"Descargar CV" apunta a /cv.pdf con download y descarga el PDF', async ({ page }) => {
  test.setTimeout(30_000)
  const h = hero(page)
  await expect(h.cv).toHaveAttribute('href', '/cv.pdf')
  await expect(h.cv).toHaveAttribute('download', /.*/)
  await expect(h.cv).not.toHaveAttribute('target', /.*/)
  const [download] = await Promise.all([page.waitForEvent('download'), h.cv.click()])
  expect(download.suggestedFilename()).toBe('cv.pdf')
  expect(await download.failure()).toBeNull()
})

test('CTAs: objetivos de 44 px, alcanzables con Tab y con foco visible', async ({ page }) => {
  const h = hero(page)
  await expectTargetSize(h.projects, 44)
  await expectTargetSize(h.cv, 44)
  await tabUntilFocused(page, h.projects)
  await expectVisibleFocus(h.projects)
  await page.keyboard.press('Tab')
  await expectVisibleFocus(h.cv)
  // Arriba de todo, nada invisible captura el puntero sobre los CTAs
  expect(await hitTest(h.projects)).toBe('ok')
  expect(await hitTest(h.cv)).toBe('ok')
})

test('axe sin violaciones en #inicio y sin overflow arriba de todo', async ({ page }) => {
  await waitForAnimationsToFinish(page, '#inicio')
  await expectNoHorizontalOverflow(page)
  await expectNoA11yViolations(page, { include: '#inicio' })
  await expectReadableContrast(page, '#inicio') // axe no lo mide con el canvas detrás
})

/* ---------------- Con movimiento: pin + scrub ---------------- */
test.describe('con movimiento', () => {
  test.beforeEach(() => {
    test.skip(isReducedProject(), 'El pin solo existe con movimiento')
  })

  test('el pin sostiene el inicio, encoge el marco y se libera al bajar con la rueda', async ({ page }) => {
    const h = hero(page)
    await expect(h.pinned).toHaveCount(1)

    // Durante el pin: el bloque fijado sigue arriba y el marco se encoge
    await wheelScroll(page, 400)
    expect(await scrollY(page)).toBeGreaterThan(300)
    const box = await h.pinned.boundingBox()
    expect(Math.abs(box.y), 'el inicio tendría que quedar fijado arriba').toBeLessThanOrEqual(1)
    await expect(h.h1).toBeInViewport()
    expect(await frameScale(page)).toBeLessThan(0.95)
    await expectNoHorizontalOverflow(page)

    // Al seguir bajando se libera y entra Perfil, sin que nada lo tape ni se superponga
    await wheelUntilInView(page, h.perfilH2, { maxTop: 0.6 })
    await waitForScrollSettled(page)
    const pinBottom = (await h.pinned.boundingBox()).y + (await h.pinned.boundingBox()).height
    const perfilTop = (await page.locator('#perfil').boundingBox()).y
    expect(pinBottom, 'el inicio no puede quedar encima de Perfil').toBeLessThanOrEqual(perfilTop + 1)
    expect(await hitTest(h.perfilH2)).toBe('ok')
    await expectNoHorizontalOverflow(page)

    // Ida y vuelta: al volver arriba el scrub deshace todo
    await jumpTo(page, 0)
    await expect.poll(() => frameScale(page)).toBeGreaterThan(0.99)
    expect(await hitTest(h.projects)).toBe('ok')
  })

  test('sin overflow horizontal en ningún punto del pin (filas en movimiento)', async ({ page }) => {
    const h = hero(page)
    for (let i = 0; i < 8; i++) {
      await wheelScroll(page, 250)
      await expectNoHorizontalOverflow(page)
      if (await h.perfilH2.isVisible() && (await h.perfilH2.boundingBox()).y < 300) break
    }
  })

  test('axe sin violaciones en #inicio a mitad del pin (marco reducido sobre fondo oscuro)', async ({ page }) => {
    await wheelScroll(page, 400)
    await waitForAnimationsToFinish(page, '#inicio')
    await expectNoA11yViolations(page, { include: '#inicio' })
    await expectReadableContrast(page, '#inicio')
  })

  test('la firma del IN (decorativa) no captura el puntero sobre el h1 ni sobre los CTAs', async ({ page }) => {
    const h = hero(page)
    expect(await hitTest(h.h1), 'h1 arriba de todo').toBe('ok')
    expect(await hitTest(h.projects), '"Ver proyectos" arriba de todo').toBe('ok')
    expect(await hitTest(h.cv), '"Descargar CV" arriba de todo').toBe('ok')
    // Avanzamos el pin hasta que el marco terminó de encogerse y los CTAs siguen en pantalla
    for (let i = 0; i < 6 && (await frameScale(page)) > 0.65; i++) await wheelScroll(page, 200)
    const hit = await hitTest(h.projects)
    expect(['ok', 'offscreen'], `"Ver proyectos" a mitad del pin: ${hit}`).toContain(hit)
    expect(await hitTest(h.h1), 'h1 a mitad del pin').toMatch(/^(ok|offscreen)$/)
  })
})

/* ---------------- Movimiento reducido: versión estática ---------------- */
test.describe('movimiento reducido', () => {
  test.beforeEach(() => {
    test.skip(!isReducedProject(), 'Solo en los proyectos *-reduced')
  })

  test('sin pin, sin filas ni firma; el inicio se desplaza como una sección más', async ({ page }) => {
    const h = hero(page)
    await expect(page.locator('#inicio .pin-spacer')).toHaveCount(0)
    const decor = await page.evaluate(() => {
      const hero = document.getElementById('inicio')
      const rows = [...hero.querySelectorAll('p')].filter((p) => /Pieza por pieza/.test(p.textContent))
      const firma = hero.querySelector('[data-stage-pose="firma"]')
      const shown = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0
      return { rows: rows.some(shown), firma: shown(firma) }
    })
    expect(decor).toEqual({ rows: false, firma: false })
    expect(await frameScale(page)).toBe(1)

    const before = (await h.h1.boundingBox()).y
    const y = await wheelScroll(page, 300)
    const after = (await h.h1.boundingBox()).y
    expect(before - after, 'sin pin, el h1 sube lo mismo que el scroll').toBeGreaterThan(y - 5)
    expect(await frameScale(page)).toBe(1)
  })

  test('el contenido está completo y opaco desde el arranque', async ({ page }) => {
    const h = hero(page)
    for (const loc of [h.h1, h.projects, h.cv]) {
      await expect(loc).toBeVisible()
      const opacity = await loc.evaluate((el) => {
        let o = 1
        for (let n = el; n && n !== document.documentElement; n = n.parentElement) o *= Number(getComputedStyle(n).opacity)
        return o
      })
      expect(opacity).toBe(1)
    }
    expect(await hitTest(h.h1)).toBe('ok')
  })
})
