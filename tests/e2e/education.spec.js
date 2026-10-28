// Recorrido (#recorrido): src/features/education.
//
// h2 "Recorrido", bajada y un <ol> con cinco pasos (h3): cuatro cursos de Coderhouse, cada uno
// con su columna de bloques (aria-hidden, un bloque cada ~10 h: son los 19 bloques de la pose
// "path" del IN) y "Ver certificado: <curso>" (aria-expanded/aria-controls), y la carrera en UADE,
// sin bloques ni certificado. Un solo certificado visible a la vez; Escape lo cierra desde
// cualquier lugar. La miniatura (Cloudinary, w_480) se pide recién al abrir o enfocar el botón.
// Con ≥1024 px y puntero fino hay vista previa al pasar el cursor, con una intención de 200 ms;
// cerrarla a propósito (botón o Escape) la silencia hasta que el cursor sale del paso.
// Con ≥1024 px los pasos son columnas alineadas con subgrid; por debajo, una columna y el
// certificado se abre en el flujo (la escena 3D vuelve a medir los bloques: stage:layout).
import {
  test,
  expect,
  waitForAppReady,
  waitForAnimationsToFinish,
  wheelScroll,
  jumpTo,
  nextFrames,
  expectNoHorizontalOverflow,
  expectTargetSize,
  expectNoA11yViolations,
  expectReadableContrast,
  expectVisibleFocus,
  findCoveredContent,
  keyboardFocus,
  dominantColors,
  colorDistance,
  parseRgb,
} from './helpers/index.js'

const TITLE = 'Recorrido'
const LEAD =
  'Cuatro cursos intensivos de programación en Coderhouse y, desde 2025, la licenciatura en Gestión de la Tecnología de la Información en UADE. Cada bloque equivale a unas diez horas de cursada.'
const CLOUDINARY_THUMB = 'https://res.cloudinary.com/dvcmgnvwi/image/upload/w_480'

// Contrato de contenido (src/features/education/i18n/es.js y src/shared/data/certifications.js)
const STEPS = [
  { id: 'web', what: 'Desarrollo Web', when: 'Jun. 2023 · 38 h', where: 'Coderhouse', blocks: 4 },
  { id: 'javascript', what: 'JavaScript', when: 'Ago. 2023 · 34 h', where: 'Coderhouse', blocks: 3 },
  { id: 'react', what: 'React Js', when: 'Oct. 2023 · 30 h', where: 'Coderhouse · Top 10 del curso', blocks: 3, accent: true },
  { id: 'backend', what: 'Programación Backend', when: 'May. 2024 · 94 h', where: 'Coderhouse', blocks: 9 },
  { id: 'uade', what: 'Lic. en Gestión de TI', when: 'Mar. 2025 – hoy', where: 'UADE · Licenciatura en Gestión de la Tecnología de la Información', blocks: 0 },
]
const COURSES = STEPS.filter((s) => s.blocks > 0)
// La columna más alta (Backend) abre su certificado al costado en escritorio (clase certBeside)
const BESIDE = 'backend'
const certAlt = (what) => `Certificado de Coderhouse del curso ${what}, a nombre de Ivan Navatta`

const isReducedProject = () => test.info().project.use.reducedMotion === 'reduce'
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** @param {import('@playwright/test').Page} page */
const path = (page) => {
  const section = page.locator('#recorrido')
  const list = section.locator('ol')
  const step = (what) => list.locator(':scope > li').filter({ has: page.getByRole('heading', { level: 3, name: what, exact: true }) })
  return {
    section,
    list,
    h2: section.getByRole('heading', { level: 2, name: TITLE, exact: true }),
    step,
    button: (what) => section.getByRole('button', { name: new RegExp(`^Ver certificado\\s*:\\s*${escape(what)}$`) }),
    cert: (id) => page.locator(`#cert-${id}`),
    visibleCerts: section.locator('figure:not([hidden])'),
  }
}

/** Ids de los certificados visibles (figure sin hidden). */
const openCerts = (page) =>
  page.evaluate(() => [...document.querySelectorAll('#recorrido figure')].filter((f) => !f.hidden).map((f) => f.id.replace('cert-', '')))

/** Requests a Cloudinary (miniaturas) desde que arrancó la página. */
function trackCloudinary(page) {
  const urls = []
  page.on('request', (r) => {
    if (r.url().startsWith('https://res.cloudinary.com/')) urls.push(r.url())
  })
  return urls
}

/**
 * Ventana de tiempo medida en la página. Solo para afirmar que algo NO pasa dentro de un plazo
 * (la intención de 200 ms del hover): no se usa para sincronizar.
 */
const pageDelay = (page, ms) => page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), ms)

/** Pone el puntero fuera de la lista (margen izquierdo). */
const pointerAway = async (page) => {
  await page.mouse.move(4, Math.round(page.viewportSize().height / 2))
}

/** Desplaza (sin rueda) para que el fondo de la lista quede a `gap` px del pie de la pantalla. */
async function showListBottom(page, gap = 30) {
  const y = await page.evaluate((gap) => {
    const ol = document.querySelector('#recorrido ol').getBoundingClientRect()
    return Math.max(0, Math.round(ol.bottom + scrollY - innerHeight + gap))
  }, gap)
  await jumpTo(page, y)
}

/** Desplaza para que `selector` quede centrado en la pantalla. */
async function centerOn(page, selector) {
  const y = await page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect()
    return Math.max(0, Math.round(r.top + scrollY + r.height / 2 - innerHeight / 2))
  }, selector)
  await jumpTo(page, y)
}

/** Centro del h3 de un paso (donde se apoya el cursor para el hover). */
async function stepPoint(s, what) {
  const box = await s.step(what).getByRole('heading', { level: 3 }).boundingBox()
  return { x: box.x + Math.min(40, box.width / 2), y: box.y + box.height / 2 }
}

test.beforeEach(async ({ page }) => {
  // Registro de tiempos: entrada del cursor a cada paso y cambios de visibilidad de los
  // certificados (init script: la CSP no lo bloquea)
  await page.addInitScript(() => {
    window.__path = { enter: [], leave: [], certs: [], maxOpen: 0 }
    const stepOf = (n) => n?.closest?.('#recorrido ol > li')
    document.addEventListener(
      'pointerover',
      (e) => {
        const li = stepOf(e.target)
        if (li && !li.contains(e.relatedTarget)) window.__path.enter.push({ t: performance.now(), i: [...li.parentElement.children].indexOf(li) })
      },
      true,
    )
    document.addEventListener(
      'pointerout',
      (e) => {
        const li = stepOf(e.target)
        if (li && !li.contains(e.relatedTarget)) window.__path.leave.push({ t: performance.now(), i: [...li.parentElement.children].indexOf(li) })
      },
      true,
    )
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.target.tagName !== 'FIGURE' || !r.target.id.startsWith('cert-')) continue
        window.__path.certs.push({ t: performance.now(), id: r.target.id.replace('cert-', ''), open: !r.target.hidden })
      }
      const open = document.querySelectorAll('#recorrido figure:not([hidden])').length
      window.__path.maxOpen = Math.max(window.__path.maxOpen, open)
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['hidden'] })

    // Observador de dibujos de WebGL (no cambia nada: anota y llama al original). Con
    // window.__glWatch = { id } activo, guarda la hora y si el certificado ocupaba lugar.
    for (const Ctx of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!Ctx) continue
      for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
        const original = Ctx.prototype[name]
        if (!original) continue
        Ctx.prototype[name] = function (...args) {
          const w = window.__glWatch
          if (w && w.draws.length < 2000) {
            const f = document.getElementById(w.id)
            w.draws.push({ t: performance.now(), open: !!f && f.getBoundingClientRect().height > 0 })
          }
          return original.apply(this, args)
        }
      }
    }
  })
})

/* ---------------- Estructura (todos los proyectos) ---------------- */

test.describe('estructura', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('h2, bajada y un ol con cinco pasos en orden: fecha, horas, título y lugar', async ({ page }) => {
    const s = path(page)
    await expect(s.section).toHaveAttribute('aria-labelledby', 'path-title')
    await expect(s.section.getByRole('heading', { level: 2 })).toHaveCount(1)
    await expect(s.h2).toHaveId('path-title')
    await expect(s.section.locator('#path-title + p')).toHaveText(LEAD)

    await expect(s.list).toHaveCount(1)
    await expect(s.list.locator(':scope > li')).toHaveCount(STEPS.length)
    await expect(s.section.getByRole('heading', { level: 3 })).toHaveText(STEPS.map((x) => x.what))
    for (const st of STEPS) {
      const li = s.step(st.what)
      const ps = li.locator(':scope > p')
      await expect(ps, st.what).toHaveText([st.when, st.where])
      // Orden de lectura: fecha → título → lugar
      const order = await li.evaluate((el) => [...el.querySelectorAll(':scope > p, :scope > h3')].map((n) => n.tagName))
      expect(order).toEqual(['P', 'H3', 'P'])
    }

    // Snapshot ARIA: columnas de bloques y certificados cerrados fuera del árbol
    await expect(s.section).toMatchAriaSnapshot(`
      - region "${TITLE}":
        - heading "${TITLE}" [level=2]
        - paragraph: ${LEAD}
        - list:
${STEPS.map(
  (st) => `          - listitem:
            - paragraph: ${st.when}
            - heading "${st.what}" [level=3]
            - paragraph: ${st.where}${
              st.blocks ? `\n            - button /^Ver certificado\\s*:\\s*${escape(st.what)}$/` : ''
            }`,
).join('\n')}
    `)
  })

  test('columnas de bloques: aria-hidden, una por curso, 19 bloques, un acento y la carrera sin bloques', async ({ page }) => {
    const s = path(page)
    await expect(s.list).toHaveAttribute('data-stage-pose', 'path')
    for (const st of STEPS) {
      const info = await s.step(st.what).evaluate((li) => {
        const blocks = [...li.querySelectorAll('[data-stage-block]')]
        return {
          blocks: blocks.length,
          hidden: blocks.every((b) => !!b.closest('[aria-hidden="true"]')),
          accents: blocks.filter((b) => b.hasAttribute('data-stage-accent')).length,
          lastIsAccent: blocks.length > 0 && blocks.at(-1).hasAttribute('data-stage-accent'),
          focusables: li.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button, [aria-hidden="true"] [tabindex]').length,
        }
      })
      expect(info.blocks, `${st.what}: bloques`).toBe(st.blocks)
      expect(info.hidden, `${st.what}: columna aria-hidden`).toBe(true)
      expect(info.focusables).toBe(0)
      expect(info.accents, `${st.what}: acento`).toBe(st.accent ? 1 : 0)
      // El acento de React es el de arriba (columna invertida: último en el DOM)
      if (st.accent) expect(info.lastIsAccent).toBe(true)
    }
    await expect(s.list.locator('[data-stage-block]')).toHaveCount(19)
    // La carrera no tiene certificado
    await expect(s.step(STEPS[4].what).getByRole('button')).toHaveCount(0)
    await expect(s.step(STEPS[4].what).locator('figure')).toHaveCount(0)
  })

  test('"Ver certificado: <curso>": botón con aria-expanded y aria-controls; ≥44 px y foco visible', async ({ page }) => {
    const s = path(page)
    await expect(s.section.getByRole('button')).toHaveCount(COURSES.length)
    for (const c of COURSES) {
      const btn = s.button(c.what)
      await expect(btn, c.what).toHaveCount(1)
      await expect(btn).toHaveAttribute('type', 'button')
      await expect(btn).toHaveAttribute('aria-expanded', 'false')
      await expect(btn).toHaveAttribute('aria-controls', `cert-${c.id}`)
      await expect(s.cert(c.id)).toBeHidden()
      await expect(s.cert(c.id).locator('figcaption')).toHaveText(`Certificado · ${c.what} · Coderhouse`)
      await expectTargetSize(btn, 44)
      await keyboardFocus(page, btn)
      await expectVisibleFocus(btn)
    }
  })
})

/* ---------------- Certificados: teclado, Escape, uno a la vez, imagen ---------------- */

test.describe('certificados', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('Enter y Espacio abren y cierran; aria-expanded acompaña y el foco queda en el botón', async ({ page }) => {
    const s = path(page)
    const c = COURSES[1]
    const btn = s.button(c.what)
    await keyboardFocus(page, btn)
    await page.keyboard.press('Enter')
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    await expect(s.cert(c.id)).toBeVisible()
    await expect(btn).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    await expect(s.cert(c.id)).toBeHidden()
    await page.keyboard.press('Space')
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    await expect(s.cert(c.id)).toBeVisible()
    await page.keyboard.press('Space')
    await expect(s.cert(c.id)).toBeHidden()
    await expect(btn).toBeFocused()
  })

  test('Escape cierra con el foco en el botón, en otro botón o en ningún lado, sin perder el foco', async ({ page }) => {
    const s = path(page)
    const [a, b] = [COURSES[0], COURSES[2]]

    // Foco en el propio botón
    await keyboardFocus(page, s.button(a.what))
    await page.keyboard.press('Enter')
    await expect(s.cert(a.id)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(s.cert(a.id)).toBeHidden()
    await expect(s.button(a.what)).toHaveAttribute('aria-expanded', 'false')
    await expect(s.button(a.what)).toBeFocused()

    // Foco en otro botón (el certificado abierto es de otro paso)
    await page.keyboard.press('Enter')
    await expect(s.cert(a.id)).toBeVisible()
    await s.button(b.what).focus()
    await page.keyboard.press('Escape')
    await expect(s.cert(a.id)).toBeHidden()
    await expect(s.button(b.what)).toBeFocused()

    // Sin foco en ningún control
    await s.button(a.what).focus()
    await page.keyboard.press('Enter')
    await expect(s.cert(a.id)).toBeVisible()
    await page.evaluate(() => document.activeElement?.blur())
    await page.keyboard.press('Escape')
    await expect(s.cert(a.id)).toBeHidden()
    await expect(s.button(a.what)).toHaveAttribute('aria-expanded', 'false')
  })

  test('un solo certificado abierto a la vez: abrir otro cierra el anterior', async ({ page }) => {
    const s = path(page)
    await keyboardFocus(page, s.button(COURSES[0].what))
    await page.keyboard.press('Enter')
    await expect.poll(() => openCerts(page)).toEqual([COURSES[0].id])
    for (const c of COURSES.slice(1)) {
      await page.keyboard.press('Tab')
      await expect(s.button(c.what)).toBeFocused()
      await page.keyboard.press('Enter')
      await expect.poll(() => openCerts(page)).toEqual([c.id])
      for (const other of COURSES.filter((o) => o.id !== c.id)) await expect(s.button(other.what)).toHaveAttribute('aria-expanded', 'false')
    }
    // Con el mouse/toque también
    await s.button(COURSES[1].what).click()
    await expect.poll(() => openCerts(page)).toEqual([COURSES[1].id])
    expect(await page.evaluate(() => window.__path.maxOpen), 'nunca hubo dos abiertos a la vez').toBe(1)
  })

  test('la imagen: alt, src de Cloudinary w_480 y carga real sin violaciones de CSP', async ({ page }) => {
    const s = path(page)
    for (const c of COURSES) {
      const btn = s.button(c.what)
      await keyboardFocus(page, btn)
      await page.keyboard.press('Enter')
      const img = s.cert(c.id).getByRole('img', { name: certAlt(c.what), exact: true })
      await expect(img, c.what).toBeVisible()
      await expect(img).toHaveAttribute('src', new RegExp(`^${escape(CLOUDINARY_THUMB)}`))
      await expect(img).toHaveAttribute('alt', new RegExp(`^Certificado de Coderhouse del curso ${escape(c.what)}`))
      // Carga de verdad (img-src de la CSP permite la cuenta de Cloudinary de Ivan)
      await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0), { message: `${c.what}: la miniatura no cargó`, timeout: 15_000 }).toBe(true)
      await page.keyboard.press('Escape')
    }
    // El fixture cspViolations falla el test si hubo alguna violación
  })

})

test('la miniatura se pide recién al enfocar, abrir o pasar el cursor; no al cargar la página', async ({ page }) => {
  const urls = trackCloudinary(page)
  await page.goto('/')
  await waitForAppReady(page)
  const s = path(page)
  await showListBottom(page)
  await expect(s.section.locator('figure img')).toHaveCount(0)
  expect(urls, 'ninguna miniatura con la página').toEqual([])

  // Enfocar el botón la pide (sin abrir)
  const js = COURSES[1]
  await keyboardFocus(page, s.button(js.what))
  await expect.poll(() => urls.length).toBe(1)
  expect(urls[0]).toContain(CLOUDINARY_THUMB.replace('https://res.cloudinary.com', ''))
  await expect(s.cert(js.id)).toBeHidden()
  await expect(s.section.locator('figure img')).toHaveCount(1)

  // Abrir otro con clic/toque pide solo ese
  const react = COURSES[2]
  await page.evaluate(() => document.activeElement?.blur())
  const fine = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches)
  if (fine) {
    // Pasar el cursor y quedarse: abre la vista previa y recién ahí la pide
    const p = await stepPoint(s, react.what)
    await page.mouse.move(p.x, p.y)
    await expect(s.cert(react.id)).toBeVisible()
  } else if (test.info().project.use.hasTouch) await s.button(react.what).tap()
  else await s.button(react.what).click()
  await expect(s.cert(react.id)).toBeVisible()
  await expect.poll(() => urls.length).toBe(2)
  await expect(s.section.locator('figure img')).toHaveCount(2)
})

/* ---------------- Hover (≥1024 con puntero fino) ---------------- */

test.describe('vista previa con el cursor', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop' && test.info().project.name !== 'desktop-reduced', 'Puntero fino de escritorio')
    await page.goto('/')
    await waitForAppReady(page)
    await showListBottom(page)
  })

  test('intención de ~200 ms: una pasada rápida no abre, quedarse sí; salir cierra', async ({ page }) => {
    const s = path(page)
    const c = COURSES[1]
    const p = await stepPoint(s, c.what)

    // Pasada rápida (< 150 ms adentro del paso): no abre ni pide la imagen
    let dwell = Infinity
    for (let attempt = 0; attempt < 3 && dwell >= 150; attempt++) {
      await pointerAway(page)
      await page.evaluate(() => {
        window.__path.enter.length = 0
        window.__path.leave.length = 0
        window.__path.certs.length = 0
      })
      await page.mouse.move(p.x, p.y)
      await page.mouse.move(4, p.y)
      dwell = await page.evaluate(() => {
        const e = window.__path.enter.at(-1)
        const l = window.__path.leave.at(-1)
        return e && l ? l.t - e.t : Infinity
      })
    }
    expect(dwell, 'no se pudo hacer una pasada de menos de 150 ms (máquina lenta)').toBeLessThan(150)
    await pageDelay(page, 450)
    expect(await page.evaluate(() => window.__path.certs.filter((x) => x.open)), 'la pasada rápida abrió un certificado').toEqual([])
    await expect(s.section.locator('figure img')).toHaveCount(0)

    // Quedarse: abre después de la intención (≥200 ms desde que entró el cursor)
    await page.evaluate(() => {
      window.__path.enter.length = 0
      window.__path.certs.length = 0
    })
    await page.mouse.move(p.x, p.y)
    await expect(s.cert(c.id)).toBeVisible()
    const delay = await page.evaluate(() => window.__path.certs.find((x) => x.open).t - window.__path.enter[0].t)
    expect(delay, 'abre antes de la intención').toBeGreaterThanOrEqual(190)
    expect(delay, 'tarda demasiado en abrir (~350 ms tendría que alcanzar)').toBeLessThanOrEqual(600)
    // La vista previa no cambia el estado del botón a "fijado", pero sí aria-expanded (es lo visible)
    await expect(s.button(c.what)).toHaveAttribute('aria-expanded', 'true')

    // Se puede pasar el cursor sobre el certificado sin que se cierre (WCAG 1.4.13)
    const fig = await s.cert(c.id).boundingBox()
    await page.mouse.move(fig.x + fig.width / 2, fig.y + fig.height + 4, { steps: 4 }) // el puente
    await page.mouse.move(fig.x + fig.width / 2, fig.y + fig.height / 2, { steps: 4 })
    await pageDelay(page, 250)
    await expect(s.cert(c.id)).toBeVisible()

    // Salir del paso cierra enseguida
    await pointerAway(page)
    await expect(s.cert(c.id)).toBeHidden()
  })

  test('Backend: el certificado se abre al costado y el puente lateral lo mantiene abierto', async ({ page }) => {
    const s = path(page)
    const backend = COURSES.find((c) => c.id === BESIDE)
    const bars = await s.step(backend.what).locator('[aria-hidden="true"]').boundingBox()
    // Cursor sobre la columna de Backend (adentro del paso) y quedarse: abre
    await page.mouse.move(bars.x + bars.width / 2, bars.y + 10, { steps: 3 })
    await expect(s.cert(backend.id)).toBeVisible()
    const fig = await s.cert(backend.id).boundingBox()
    expect(fig.x + fig.width, 'al costado izquierdo de la columna').toBeLessThanOrEqual(bars.x + 1)
    // Cruzar el hueco hacia la izquierda (el puente) hasta el centro del certificado
    const y = Math.min(fig.y + fig.height / 2, bars.y + 10)
    await page.mouse.move(bars.x - 4, y, { steps: 4 })
    await page.mouse.move(fig.x + fig.width / 2, y, { steps: 6 })
    await pageDelay(page, 250)
    await expect(s.cert(backend.id)).toBeVisible()
    // Salir del certificado hacia afuera del paso: cierra
    await pointerAway(page)
    await expect(s.cert(backend.id)).toBeHidden()
  })

  test('pasar a otro paso reemplaza el certificado (nunca dos a la vez)', async ({ page }) => {
    const s = path(page)
    for (const c of COURSES) {
      const p = await stepPoint(s, c.what)
      await page.mouse.move(p.x, p.y, { steps: 3 })
      await expect.poll(() => openCerts(page), { message: c.what }).toEqual([c.id])
    }
    expect(await page.evaluate(() => window.__path.maxOpen)).toBe(1)
    // La carrera no tiene vista previa: al pasar ahí no queda ninguno
    const uade = await stepPoint(s, STEPS[4].what)
    await page.mouse.move(uade.x, uade.y, { steps: 3 })
    await expect.poll(() => openCerts(page)).toEqual([])
  })

  test('cerrar la vista previa con el botón o con Escape la silencia hasta salir del paso', async ({ page }) => {
    const s = path(page)
    const c = COURSES[0]
    const btn = s.button(c.what)
    const box = await btn.boundingBox()

    // Con el botón: el cursor llega al botón (adentro del paso), se abre la vista previa, clic la cierra
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 3 })
    await expect(s.cert(c.id)).toBeVisible()
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(s.cert(c.id)).toBeHidden()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    // Moverse adentro del paso no la reabre
    const p = await stepPoint(s, c.what)
    await page.mouse.move(p.x, p.y, { steps: 3 })
    await pageDelay(page, 450)
    await expect(s.cert(c.id)).toBeHidden()
    // Salir y volver: se reabre
    await pointerAway(page)
    await page.mouse.move(p.x, p.y, { steps: 3 })
    await expect(s.cert(c.id)).toBeVisible()

    // Con Escape (sin foco en el botón): también la silencia
    await page.evaluate(() => document.activeElement?.blur())
    await page.keyboard.press('Escape')
    await expect(s.cert(c.id)).toBeHidden()
    await page.mouse.move(p.x + 10, p.y, { steps: 3 })
    await pageDelay(page, 450)
    await expect(s.cert(c.id)).toBeHidden()
    await pointerAway(page)
    await page.mouse.move(p.x, p.y, { steps: 3 })
    await expect(s.cert(c.id)).toBeVisible()
  })
})

test.describe('sin vista previa con el cursor', () => {
  test('con 1023 px no hay hover (el certificado se abre en el flujo)', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop', 'Tamaño fijo: corre en desktop')
    await page.setViewportSize({ width: 1023, height: 900 })
    await page.goto('/')
    await waitForAppReady(page)
    const s = path(page)
    await centerOn(page, '#recorrido ol > li:nth-child(2)')
    const p = await stepPoint(s, COURSES[1].what)
    await page.mouse.move(p.x, p.y, { steps: 3 })
    await pageDelay(page, 450)
    expect(await openCerts(page)).toEqual([])
  })

  test('con puntero grueso no hay hover; tocar abre', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    const coarse = await page.evaluate(() => !matchMedia('(hover: hover) and (pointer: fine)').matches)
    test.skip(!coarse, 'Solo con puntero grueso')
    const s = path(page)
    await centerOn(page, '#recorrido ol > li:nth-child(2)')
    const p = await stepPoint(s, COURSES[1].what)
    await page.mouse.move(p.x, p.y, { steps: 3 })
    await pageDelay(page, 450)
    expect(await openCerts(page)).toEqual([])
    await s.button(COURSES[1].what).tap()
    await expect.poll(() => openCerts(page)).toEqual([COURSES[1].id])
  })
})

/* ---------------- Layout: subgrid ≥1024, una columna por debajo ---------------- */

/** Cajas de fecha, título, lugar, botón y columna de bloques de cada paso. */
// Relativas a la esquina de la lista: el foco puede desplazar la página entre mediciones.
const stepBoxes = (page) =>
  page.evaluate(() => {
    const o = document.querySelector('#recorrido ol').getBoundingClientRect()
    return [...document.querySelectorAll('#recorrido ol > li')].map((li) => {
      const box = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: r.top - o.top, bottom: r.bottom - o.top, height: r.height, left: r.left - o.left, right: r.right - o.left }
      }
      const ps = li.querySelectorAll(':scope > p')
      return {
        li: box(li),
        when: box(ps[0]),
        what: box(li.querySelector(':scope > h3')),
        where: box(ps[1]),
        button: box(li.querySelector('button')),
        bars: box(li.querySelector('[aria-hidden="true"]')),
      }
    })
  })

const near = (values, tol = 1) => Math.max(...values) - Math.min(...values) <= tol

for (const width of [1440, 1024]) {
  test.describe(`subgrid en ${width}`, () => {
    test.use({ viewport: { width, height: 900 } })
    test.beforeEach(() => {
      test.skip(test.info().project.name !== 'desktop', 'Tamaño fijo: corre en desktop')
    })

    test('fechas, títulos y lugares miden y se alinean igual en las cinco columnas; UADE arranca en la fila de las fechas', async ({ page }) => {
      await page.goto('/')
      await waitForAppReady(page)
      await showListBottom(page)
      const b = await stepBoxes(page)
      // Cinco columnas en una fila, de izquierda a derecha
      for (let i = 1; i < b.length; i++) expect(b[i].li.left, `columna ${i + 1}`).toBeGreaterThan(b[i - 1].li.right - 1)
      for (const key of ['when', 'what', 'where']) {
        expect(near(b.map((x) => x[key].top)), `${key}: misma línea (${b.map((x) => Math.round(x[key].top))})`).toBe(true)
        // El lugar de UADE ocupa también la fila del botón (dos líneas): no cuenta para el alto
        const heights = (key === 'where' ? b.slice(0, 4) : b).map((x) => x[key].height)
        expect(near(heights), `${key}: mismo alto (${heights.map(Math.round)})`).toBe(true)
      }
      // Botones de los cuatro cursos en la misma línea; columnas de bloques apoyadas en la misma base
      expect(near(b.slice(0, 4).map((x) => x.button.top))).toBe(true)
      expect(near(b.slice(0, 4).map((x) => x.bars.bottom))).toBe(true)
      for (const x of b.slice(0, 4)) expect(x.bars.bottom).toBeLessThanOrEqual(x.when.top)
      // UADE: sin columna de bloques, su fecha arranca en la fila de las fechas de los cursos
      expect(b[4].bars).toBeNull()
      expect(Math.abs(b[4].when.top - b[0].when.top)).toBeLessThanOrEqual(1)
      await expectNoHorizontalOverflow(page)
    })

    test('cada certificado flota en su lugar (Backend al costado), entero, sin pisar texto ni bloques y sin correr el layout', async ({ page }) => {
      await page.goto('/')
      await waitForAppReady(page)
      const s = path(page)
      await showListBottom(page)
      const before = await stepBoxes(page)
      for (const c of COURSES) {
        await keyboardFocus(page, s.button(c.what))
        await page.keyboard.press('Enter')
        await expect(s.cert(c.id)).toBeVisible()
        await waitForAnimationsToFinish(page, '#recorrido')
        const r = await certPlacement(page, c.id)
        expect(r.position, `${c.what}: flota`).toBe('absolute')
        expect(r.cert.left, `${c.what}: entra por la izquierda`).toBeGreaterThanOrEqual(0)
        expect(r.cert.right, `${c.what}: entra por la derecha`).toBeLessThanOrEqual(r.vw)
        // Texto: ninguno lo pisa. Bloques de otros pasos: solo se exige a Backend (el certificado de
        // React, de 340 px, pasa por encima de la columna de Backend: es un popover y está aceptado)
        expect(r.overlaps.filter((o) => !o.startsWith('bloque')), `${c.what}: pisa texto`).toEqual([])
        if (c.id === BESIDE) expect(r.overlaps, 'Backend: pisa la bajada o los bloques de React').toEqual([])
        if (c.id === BESIDE) {
          // La columna más alta: a la izquierda, con el borde de arriba a la altura de su primer bloque
          expect(r.cert.right, 'Backend: a la izquierda de su columna').toBeLessThanOrEqual(r.bars.left + 1)
          expect(Math.abs(r.cert.top - r.bars.top), 'Backend: arriba a la altura del primer bloque').toBeLessThanOrEqual(2)
          expect(r.cert.width, 'Backend: min(280px, 26vw)').toBeLessThanOrEqual(Math.min(280, 0.26 * width) + 1)
        } else {
          expect(r.cert.bottom, `${c.what}: queda encima de su columna`).toBeLessThanOrEqual(r.bars.top + 1)
        }
        expect(await stepBoxes(page), 'abrir no mueve nada').toEqual(before)
        await expectNoHorizontalOverflow(page)
        await page.keyboard.press('Escape')
      }
    })

    test('Backend al costado: no queda bajo la cabecera, aunque la cabecera aparezca', async ({ page }) => {
      await page.goto('/')
      await waitForAppReady(page)
      const s = path(page)
      const backend = COURSES.find((c) => c.id === BESIDE)
      // Botón de Backend a la vista y la cabecera visible (aparece al subir con la rueda)
      await showListBottom(page)
      await wheelScroll(page, -60)
      await expect(page.locator('header')).not.toHaveAttribute('data-nav-state', 'hidden')
      await keyboardFocus(page, s.button(backend.what))
      await page.keyboard.press('Enter')
      await expect(s.cert(backend.id)).toBeVisible()
      await waitForAnimationsToFinish(page, '#recorrido')
      const r = await certPlacement(page, backend.id)
      expect(r.cert.top, `el certificado (top ${Math.round(r.cert.top)}) queda bajo la cabecera (bottom ${Math.round(r.header)})`).toBeGreaterThanOrEqual(r.header)
    })
  })
}

/** Caja del certificado abierto y de su columna, y lo que pisa: texto de #recorrido y bloques de otros pasos. */
const certPlacement = (page, id) =>
  page.evaluate((id) => {
    const f = document.getElementById(`cert-${id}`)
    const li = f.closest('li')
    const box = (el) => {
      const b = el.getBoundingClientRect()
      return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width }
    }
    const cert = box(f)
    const hit = (b) => b.left < cert.right - 1 && b.right > cert.left + 1 && b.top < cert.bottom - 1 && b.bottom > cert.top + 1
    const overlaps = []
    for (const el of document.querySelectorAll('#recorrido h2, #recorrido h2 + p, #recorrido h3, #recorrido li > p, #recorrido li button')) {
      if (hit(box(el))) overlaps.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 25)}"`)
    }
    for (const b of document.querySelectorAll('#recorrido [data-stage-block]')) {
      if (!li.contains(b) && hit(box(b))) overlaps.push(`bloque de "${b.closest('li').querySelector('h3').textContent}"`)
    }
    const header = document.querySelector('header')
    return {
      position: getComputedStyle(f).position,
      cert,
      bars: box(li.querySelector('[aria-hidden="true"]')),
      overlaps: [...new Set(overlaps)],
      header: header ? Math.max(0, header.getBoundingClientRect().bottom) : 0,
      vw: document.documentElement.clientWidth,
    }
  }, id)

test.describe('una columna por debajo de 1024', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name === 'desktop' || test.info().project.name === 'desktop-reduced', 'Tablet y mobile (y 1023 aparte)')
  })

  test('pasos apilados y el certificado se abre en el flujo, debajo del botón, sin tapar texto', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    const s = path(page)
    const b = await stepBoxes(page)
    expect(near(b.map((x) => x.li.left))).toBe(true)
    for (let i = 1; i < b.length; i++) expect(b[i].li.top, `paso ${i + 1} debajo del anterior`).toBeGreaterThanOrEqual(b[i - 1].li.bottom - 1)

    for (const c of COURSES) {
      await keyboardFocus(page, s.button(c.what))
      await page.keyboard.press('Enter')
      await expect(s.cert(c.id)).toBeVisible()
      await waitForAnimationsToFinish(page, '#recorrido')
      const r = await page.evaluate((id) => {
        const f = document.getElementById(`cert-${id}`)
        const li = f.closest('li')
        const next = li.nextElementSibling
        const fb = f.getBoundingClientRect()
        return {
          position: getComputedStyle(f).position,
          top: fb.top,
          bottom: fb.bottom,
          buttonBottom: li.querySelector('button').getBoundingClientRect().bottom,
          nextTop: next?.getBoundingClientRect().top ?? Infinity,
        }
      }, c.id)
      expect(r.position, `${c.what}: en el flujo`).not.toBe('absolute')
      expect(r.top).toBeGreaterThanOrEqual(r.buttonBottom)
      expect(r.bottom, 'el paso siguiente queda debajo').toBeLessThanOrEqual(r.nextTop + 1)
      await centerOn(page, `#cert-${c.id}`)
      expect(await findCoveredContent(page, '#recorrido'), 'texto tapado').toEqual([])
      await expectNoHorizontalOverflow(page)
      await page.keyboard.press('Escape')
    }
  })
})

/* ---------------- Mobile y tablet: los bloques 3D siguen a los del DOM ---------------- */

/**
 * Prepara la escena para medir la alineación en tablet/mobile: posición con la pose "path"
 * asentada (#recorrido en top ≤10 % y #contacto en top ≥85 %) y el botón del primer curso en el
 * tercio de arriba, así al abrir su certificado los bloques del segundo bajan pero siguen en pantalla.
 * Devuelve `sample()`: bloques del DOM en pantalla que NO tienen un bloque 3D detrás (el color
 * dominante de su caja es el fondo de la sección), con la hora de la página justo antes de la captura.
 */
async function alignmentProbe(page) {
  const s = path(page)
  const sectionBg = parseRgb(await s.section.evaluate((el) => getComputedStyle(el).backgroundColor))
  const y = await page.evaluate(() => {
    const vh = innerHeight
    const rec = document.getElementById('recorrido').getBoundingClientRect()
    const btn = document.querySelector('#recorrido ol > li button').getBoundingClientRect()
    return Math.round(Math.max(btn.top + scrollY - vh * 0.3, rec.top + scrollY - 0.1 * vh + 30))
  })
  await jumpTo(page, y)
  await nextFrames(page, 10)
  const blocks = (only) =>
    page.evaluate((only) => {
      const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0
      return {
        t: performance.now(),
        list: [...document.querySelectorAll('#recorrido [data-stage-block]')]
          .map((b, i) => {
            const r = b.getBoundingClientRect()
            return { i, x: r.left, y: r.top, width: r.width, height: r.height }
          })
          .filter((r) => r.y > header + 2 && r.y + r.height < innerHeight - 2)
          .filter((r) => !only || only.includes(r.i)),
      }
    }, only)
  // only: índices de bloques a mirar (menos área = muestras más seguidas)
  const sample = async (only) => {
    const { t, list } = await blocks(only)
    const colors = await dominantColors(page, list, { inset: 5 })
    const bad = list
      .map((b, k) => ({ b, c: colors[k] }))
      .filter(({ c }) => colorDistance(c, sectionBg) < 80)
      .map(({ b, c }) => `bloque ${b.i} en y=${Math.round(b.y)}: rgb(${c.r},${c.g},${c.b})`)
    return { t, list, bad }
  }
  return { sample }
}

/**
 * Dispara `action` (abrir o cerrar el certificado `id`) y mide cuánto tarda la escena en volver a
 * dibujar con el layout nuevo. La escena dibuja a demanda y en cada dibujo vuelve a leer los
 * bloques del DOM (poses.js), así que un dibujo hecho cuando el certificado ya cambió el layout es
 * un dibujo alineado. Un init script (ver beforeEach) anota cada llamada de dibujo de WebGL con el
 * alto del certificado en ese momento; un rAF anota cuándo cambió el layout.
 * @returns {Promise<{ layoutAt: number, firstDrawAfter: number | null }>} ms de la página
 */
async function redrawAfterLayout(page, id, action) {
  await page.evaluate((id) => {
    const f = document.getElementById(`cert-${id}`)
    const was = f.getBoundingClientRect().height > 0
    window.__glWatch = { id: `cert-${id}`, was, draws: [] }
    window.__layoutAt = null
    const tick = () => {
      if (f.getBoundingClientRect().height > 0 !== was) window.__layoutAt = performance.now()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, id)
  await action()
  await expect.poll(() => page.evaluate(() => window.__layoutAt), { message: 'el certificado tendría que cambiar el layout' }).not.toBeNull()
  // Margen para que llegue el dibujo (o se vea que no llega): el debounce de stage es de 200 ms
  await pageDelay(page, 600)
  return page.evaluate(() => {
    const { was, draws } = window.__glWatch
    window.__glWatch = null
    const first = draws.find((d) => d.open !== was)
    return { layoutAt: window.__layoutAt, firstDrawAfter: first ? first.t : null }
  })
}

// "Uno o dos cuadros", con margen: el rAF que detecta el cambio de layout puede llegar un cuadro tarde
const FRAMES_2 = 60
test.describe('tablet y mobile: los bloques 3D siguen a los del DOM', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!['mobile', 'tablet'].includes(test.info().project.name), 'Certificado en el flujo con escena viva')
    await page.goto('/')
    await waitForAppReady(page)
    const live = await page.evaluate(() => document.documentElement.classList.contains('live') && document.documentElement.classList.contains('gl'))
    test.skip(!live, 'Sin escena WebGL viva')
  })

  test('al abrir un certificado, la escena redibuja los bloques en uno o dos cuadros y quedan alineados', async ({ page }) => {
    const s = path(page)
    const probe = await alignmentProbe(page)
    const pre = await probe.sample()
    expect(pre.list.length, 'tendría que haber bloques en pantalla').toBeGreaterThan(3)
    expect(pre.bad, 'antes de abrir: hay bloques del DOM sin bloque 3D detrás').toEqual([])

    const r = await redrawAfterLayout(page, COURSES[0].id, () => s.button(COURSES[0].what).tap())
    await expect(s.cert(COURSES[0].id)).toBeVisible()
    expect(r.firstDrawAfter, 'la escena no volvió a dibujar con el certificado abierto').not.toBeNull()
    expect(r.firstDrawAfter - r.layoutAt, 'ms entre el cambio de layout y el primer dibujo alineado').toBeLessThanOrEqual(FRAMES_2)

    // Y en pantalla: los bloques que bajaron tienen su bloque 3D detrás
    const post = await probe.sample()
    const moved = post.list.filter((b) => b.i >= COURSES[0].blocks)
    expect(moved.length, 'los bloques del segundo curso tendrían que seguir en pantalla').toBeGreaterThan(0)
    expect(moved[0].y, 'los bloques siguientes tendrían que haber bajado').toBeGreaterThan(pre.list.find((b) => b.i === moved[0].i)?.y ?? 0)
    expect(post.bad, 'después de abrir: bloques del DOM sin bloque 3D detrás').toEqual([])
  })

  // Bug path-close-lag (corregido): al cerrar, `hidden` saca el certificado del layout recién al
  // terminar la transición de salida y el aviso a la escena llegaba antes. Ahora un ResizeObserver
  // sobre la lista avisa sin debounce cuando cambia de tamaño de verdad.
  test('al cerrar el certificado, la escena redibuja los bloques en uno o dos cuadros y quedan alineados', async ({ page }) => {
    const s = path(page)
    const probe = await alignmentProbe(page)
    await s.button(COURSES[0].what).tap()
    await expect(s.cert(COURSES[0].id)).toBeVisible()
    await waitForAnimationsToFinish(page, '#recorrido')
    await expect.poll(async () => (await probe.sample()).bad, { message: 'abierto y asentado' }).toEqual([])

    const r = await redrawAfterLayout(page, COURSES[0].id, () => page.keyboard.press('Escape'))
    await expect(s.cert(COURSES[0].id)).toBeHidden()
    // Al final (con el debounce ya pasado) quedan alineados: el problema es la demora
    expect((await probe.sample()).bad, 'después de cerrar y esperar: bloques sin bloque 3D detrás').toEqual([])
    expect(r.firstDrawAfter, 'la escena no volvió a dibujar con el certificado cerrado').not.toBeNull()
    expect(r.firstDrawAfter - r.layoutAt, 'ms entre el cambio de layout y el primer dibujo alineado').toBeLessThanOrEqual(FRAMES_2)
  })
})

/* ---------------- axe, contraste y overflow ---------------- */

test('axe y contraste AA en #recorrido con el certificado cerrado y abierto', async ({ page }) => {
  test.skip(test.info().project.name === 'tablet', 'axe por sección corre en desktop, mobile y *-reduced')
  await page.goto('/')
  await waitForAppReady(page)
  const s = path(page)
  await showListBottom(page)
  await nextFrames(page, 5)
  await waitForAnimationsToFinish(page, '#recorrido')
  await expectNoA11yViolations(page, { include: '#recorrido' })
  await expectReadableContrast(page, '#recorrido')

  for (const c of [COURSES[0], COURSES[3]]) {
    await keyboardFocus(page, s.button(c.what))
    await page.keyboard.press('Enter')
    const img = s.cert(c.id).getByRole('img')
    await expect(img).toBeVisible()
    await expect.poll(() => img.evaluate((el) => el.complete), { timeout: 15_000 }).toBe(true)
    await centerOn(page, `#cert-${c.id}`)
    await waitForAnimationsToFinish(page, '#recorrido')
    await expectNoA11yViolations(page, { include: '#recorrido' })
    await expectReadableContrast(page, '#recorrido')
    await page.keyboard.press('Escape')
  }
})

test('sin overflow horizontal en la sección, con cada certificado abierto', async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)
  const s = path(page)
  await jumpTo(page, '#recorrido')
  await expectNoHorizontalOverflow(page)
  for (const c of COURSES) {
    await keyboardFocus(page, s.button(c.what))
    await page.keyboard.press('Enter')
    await expect(s.cert(c.id)).toBeVisible()
    await waitForAnimationsToFinish(page, '#recorrido')
    await expectNoHorizontalOverflow(page)
    await page.keyboard.press('Escape')
  }
  await wheelScroll(page, 600)
  await expectNoHorizontalOverflow(page)
})

/* ---------------- Movimiento reducido ---------------- */

test.describe('movimiento reducido', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isReducedProject(), 'Solo en los proyectos *-reduced')
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('bloques planos (tinta y acento) y el certificado se abre por teclado, sin transform', async ({ page }) => {
    const s = path(page)
    const html = await page.evaluate(() => ({ motion: document.documentElement.dataset.motion, live: document.documentElement.classList.contains('live') }))
    expect(html).toEqual({ motion: 'reduced', live: false })

    const colors = await s.section.evaluate((sec) => {
      const probe = (v) => {
        const p = document.createElement('span')
        p.style.color = `var(${v})`
        sec.appendChild(p)
        const c = getComputedStyle(p).color
        p.remove()
        return c
      }
      const blocks = [...sec.querySelectorAll('[data-stage-block]')]
      return {
        ink: probe('--ink'),
        accent: probe('--accent'),
        plain: blocks.filter((b) => !b.hasAttribute('data-stage-accent')).map((b) => getComputedStyle(b).backgroundColor),
        accents: blocks.filter((b) => b.hasAttribute('data-stage-accent')).map((b) => getComputedStyle(b).backgroundColor),
        sizes: blocks.map((b) => Math.round(b.getBoundingClientRect().width)),
      }
    })
    expect(new Set(colors.plain)).toEqual(new Set([colors.ink]))
    expect(colors.accents).toEqual([colors.accent])
    expect(colors.sizes.every((w) => w >= 24)).toBe(true)

    // El canvas no acompaña al recorrido: queda arriba con el IN del inicio
    const canvasBottom = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      return c && getComputedStyle(c).display !== 'none' ? c.getBoundingClientRect().bottom + scrollY : 0
    })
    const top = await s.section.evaluate((el) => el.getBoundingClientRect().top + scrollY)
    expect(canvasBottom).toBeLessThan(top)

    const c = COURSES[2]
    await keyboardFocus(page, s.button(c.what))
    await page.keyboard.press('Enter')
    await expect(s.cert(c.id)).toBeVisible()
    await expect(s.cert(c.id)).toHaveCSS('transform', 'none')
    await expect(s.cert(c.id).getByRole('img', { name: certAlt(c.what) })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(s.cert(c.id)).toBeHidden()
    await expect(s.button(c.what)).toBeFocused()
  })
})
