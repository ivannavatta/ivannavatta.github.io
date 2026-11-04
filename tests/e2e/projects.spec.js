// Proyectos (#proyectos): src/features/projects.
//
// Cuatro <article> (MyTube, Sistema de transporte, uadeHUB, box9) con aria-labelledby. Pin con
// casos apilados solo si el ancho es ≥1024, el alto ≥700 y el caso más alto entra entero; si no,
// lista. Los casos que no entraron esperan con opacity 0 y pointer-events none, y si reciben foco
// de teclado el scroll salta hasta ellos. "Ver arquitectura" ↔ "Ver resumen" (aria-expanded).
// Figuras con nombre accesible. Links con TextLink y aviso de pestaña nueva; MyTube enlaza su app
// publicada y el TPO de Java su repositorio (ya público). Sistema de transporte, uadeHUB y box9
// suman "Probar en vivo" (live-demo.spec.js); MyTube no.
import {
  test,
  expect,
  waitForAppReady,
  waitForAnimationsToFinish,
  wheelScroll,
  jumpTo,
  scrollY,
  expectNoHorizontalOverflow,
  expectNoA11yViolations,
  expectReadableContrast,
  expectVisibleFocus,
  findCoveredContent,
  keyboardFocus,
  waitForScrollSettled,
  placeAt,
  startScrollTrace,
  scrollTrace,
  expectRevealed,
} from './helpers/index.js'

const CASES = [
  { id: 'mytube', name: 'MyTube' },
  { id: 'transporte', name: 'Sistema de transporte' },
  { id: 'uadehub', name: 'uadeHUB' },
  { id: 'box9', name: 'box9' },
]
const GITHUB = 'https://github.com/ivannavatta'
const LINKS = {
  mytube: [
    ['App en vivo', 'https://mytube-green.vercel.app'],
    ['Repositorio frontend', `${GITHUB}/mytube`],
    ['Repositorio backend', `${GITHUB}/mytube-backend`],
  ],
  transporte: [['Repositorio', `${GITHUB}/-UADE-2025-PROGRA-II`]], // el TPO de Java, público desde la ronda 9
  uadehub: [['Repositorio', `${GITHUB}/uadeHUB`]],
  box9: [['Repositorio', `${GITHUB}/box9`]],
}

/** Casos con "Probar en vivo" (data/projects.js, `live: true`). */
const LIVE = ['transporte', 'uadehub', 'box9']

const isReducedProject = () => test.info().project.use.reducedMotion === 'reduce'

/** @param {import('@playwright/test').Page} page */
const work = (page) => {
  const section = page.locator('#proyectos')
  return {
    section,
    h2: section.getByRole('heading', { level: 2, name: 'Proyectos', exact: true }),
    intro: section.locator('#work-title + p'),
    article: (name) => section.getByRole('article', { name, exact: true }),
    spacer: section.locator('.pin-spacer'),
  }
}

/** Estado visible de cada caso: opacidad efectiva, caja y si su centro lo recibe el propio caso. */
const caseStates = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('#proyectos article')].map((a) => {
      const r = a.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = Math.min(Math.max(r.top + 40, 1), innerHeight - 1)
      const top = document.elementFromPoint(cx, cy)
      return {
        id: a.id.replace('case-', ''),
        opacity: Number(getComputedStyle(a).opacity),
        pointer: getComputedStyle(a).pointerEvents,
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        front: !!top && a.contains(top),
      }
    }),
  )

/** ¿El elemento con foco se ve? Opacidad efectiva 1, dentro de la pantalla y sin nada encima. */
const focusedVisibility = (page) =>
  page.evaluate(() => {
    const el = document.activeElement
    const r = el.getBoundingClientRect()
    let o = 1
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) o *= Number(getComputedStyle(n).opacity)
    const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0
    const cy = r.top + r.height / 2
    const top = document.elementFromPoint(r.left + r.width / 2, cy)
    return {
      name: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40),
      article: el.closest('article')?.id ?? null,
      opacity: Math.round(o * 100) / 100,
      inView: r.top >= Math.max(0, header - 4) && r.bottom <= innerHeight,
      onTop: !!top && el.contains(top),
    }
  })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)
})

/* ---------------- Estructura, links y figuras (todos los tamaños) ---------------- */

test('estructura: h2, bajada, cuatro article con su h3, ficha y botón', async ({ page }) => {
  const w = work(page)
  await expect(w.section.getByRole('heading', { level: 2 })).toHaveCount(1)
  await expect(w.h2).toBeAttached()
  await expect(w.intro).toHaveText(/^Cuatro sistemas/)
  await expect(w.section.getByRole('article')).toHaveCount(4)
  for (const { id, name } of CASES) {
    const a = w.article(name)
    await expect(a, name).toHaveAttribute('aria-labelledby', `t-${id}`)
    await expect(a.getByRole('heading', { level: 3 })).toHaveText(name)
    await expect(a.locator('dl dt')).toHaveText(['Problema', 'Rol', 'Stack'])
    await expect(a.locator('dl dd')).toHaveCount(3)
    const more = a.getByRole('button', { name: 'Ver arquitectura' })
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    await expect(more).toHaveAttribute('aria-controls', `more-${id}`)
    await expect(page.locator(`#more-${id}`)).toBeHidden()
    // "Probar en vivo" (live-demo.spec.js): todos menos MyTube, cerrado y sin terminal montada
    const live = a.getByRole('button', { name: 'Probar en vivo' })
    await expect(live, name).toHaveCount(LIVE.includes(id) ? 1 : 0)
    if (LIVE.includes(id)) {
      await expect(live).toHaveAttribute('aria-expanded', 'false')
      await expect(live).toHaveAttribute('type', 'button')
      await expect(page.locator(`#live-${id}`)).toHaveCount(0)
    }
  }
  // Orden de los casos
  await expect(w.section.getByRole('heading', { level: 3 })).toHaveText(CASES.map((c) => c.name))
  // La base de ladrillos (pose "visor" del IN) es decorativa
  const decor = await w.section.evaluate((s) =>
    [...s.querySelectorAll('[data-stage-pose]')].map((el) => !!el.closest('[aria-hidden="true"]')),
  )
  expect(decor.length).toBeGreaterThan(0)
  expect(decor.every(Boolean)).toBe(true)
})

test('links: repositorios (también el del TPO de Java) y la app de MyTube con aviso de pestaña nueva', async ({ page }) => {
  const w = work(page)
  for (const { id, name } of CASES) {
    const links = w.article(name).getByRole('link', { includeHidden: true })
    await expect(links, name).toHaveCount(LINKS[id].length)
    for (const [i, [label, href]] of LINKS[id].entries()) {
      const link = links.nth(i)
      await expect(link).toHaveAccessibleName(`${label} (se abre en otra pestaña)`)
      await expect(link).toHaveAttribute('href', href)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noopener/)
      await expect(link).toHaveAttribute('rel', /noreferrer/)
    }
  }
  // Transporte enlaza solo su repositorio: ningún otro <a> en el caso
  await expect(w.article('Sistema de transporte').locator('a')).toHaveCount(1)
  // En toda la página, los únicos repositorios enlazados son los permitidos (lista cerrada: un repo
  // nuevo tiene que sumarse acá a propósito). El perfil de GitHub, sin ruta, no cuenta.
  const ALLOWED_REPOS = ['mytube', 'mytube-backend', '-UADE-2025-PROGRA-II', 'uadeHUB', 'box9'].map((r) => `${GITHUB}/${r}`)
  const repoLinks = await page
    .locator(`a[href^="${GITHUB}/"]`)
    .evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute('href').replace(/\/+$/, '')))].sort())
  expect(repoLinks).toEqual([...ALLOWED_REPOS].sort())
  // El único deploy enlazado es la app de MyTube
  await expect(page.locator('a[href*="vercel.app"]')).toHaveCount(1)
})

test('figuras con nombre accesible y su epígrafe', async ({ page }) => {
  const w = work(page)
  // Cada caso tiene una figura con epígrafe
  for (const { name } of CASES) {
    const fig = w.article(name).getByRole('figure', { includeHidden: true })
    await expect(fig, name).toHaveCount(1)
    await expect(fig.locator('figcaption')).not.toBeEmpty()
  }
  // Transporte: grafo SVG role="img" nombrado por su <title>
  const graph = w.article('Sistema de transporte').getByRole('img', { includeHidden: true })
  await expect(graph).toHaveAccessibleName(/^Grafo de siete terminales/)
  await expect(graph.locator('title')).toHaveCount(1)
  // Las letras del grafo no se leen sueltas
  const labelsHidden = await w
    .article('Sistema de transporte')
    .locator('svg text')
    .evaluateAll((texts) => texts.length > 0 && texts.every((t) => !!t.closest('[aria-hidden="true"]')))
  expect(labelsHidden).toBe(true)
  // uadeHUB: consola en <pre><code> con el legajo de ejemplo marcado
  const code = w.article('uadeHUB').locator('pre > code')
  await expect(code).toContainText('Inicio de sesión en UADE Desk Finder')
  await expect(code.locator('mark')).toHaveText('12345')
  // box9: matriz con role="img" y aria-label
  const matrix = w.article('box9').getByRole('img', { includeHidden: true })
  await expect(matrix).toHaveAccessibleName(/^Matriz de tres por tres/)
})

test('"Ver arquitectura" abre el panel y pasa a "Ver resumen"; con teclado también', async ({ page }) => {
  const w = work(page)
  for (const { id, name } of CASES) {
    const a = w.article(name)
    const btn = a.getByRole('button', { name: /^Ver (arquitectura|resumen)$/ })
    const panel = page.locator(`#more-${id}`)
    // Foco de teclado: si el caso todavía no entró en el apilado, el scroll lo trae
    await keyboardFocus(page, btn)
    await expect.poll(async () => (await focusedVisibility(page)).opacity, { message: `${name} visible al recibir foco` }).toBe(1)

    await page.keyboard.press('Enter')
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    await expect(btn).toHaveAccessibleName('Ver resumen')
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('heading', { level: 4 })).toHaveText(['Arquitectura', 'Decisiones'])
    await expect(panel.getByRole('listitem').first()).toBeVisible()
    await expect(btn).toBeFocused() // el foco no se pierde al cambiar el texto

    await page.keyboard.press('Space')
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    await expect(btn).toHaveAccessibleName('Ver arquitectura')
    await expect(panel).toBeHidden()
    await expect(a.getByRole('figure')).toBeVisible() // vuelve la figura
  }
})

test('Tab recorre los cuatro casos en orden y cada foco queda visible, sin nada encima', async ({ page }) => {
  const w = work(page)
  const first = w.article('MyTube').getByRole('link').first()
  await keyboardFocus(page, first)
  const seen = []
  const problems = []
  for (let i = 0; i < 30; i++) {
    await expect.poll(async () => (await focusedVisibility(page)).opacity).toBe(1)
    const f = await focusedVisibility(page)
    if (!f.article) break // salió de Proyectos
    if (!seen.includes(f.article)) seen.push(f.article)
    if (!f.inView || !f.onTop) problems.push(`${f.article} "${f.name}": inView=${f.inView} onTop=${f.onTop}`)
    await expectVisibleFocus(page.locator(':focus'))
    await page.keyboard.press('Tab')
  }
  expect(seen).toEqual(CASES.map((c) => `case-${c.id}`))
  expect(problems, 'foco fuera de pantalla o tapado').toEqual([])

  // Y de vuelta con Shift+Tab: al volver a un caso de atrás, tiene que quedar adelante
  const back = []
  await w.article('box9').getByRole('button', { name: /^Ver (arquitectura|resumen)$/ }).focus()
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Shift+Tab')
    await expect.poll(async () => (await focusedVisibility(page)).opacity).toBe(1)
    const f = await focusedVisibility(page)
    if (!f.article) break
    if (!f.inView || !f.onTop) back.push(`${f.article} "${f.name}": inView=${f.inView} onTop=${f.onTop}`)
  }
  expect(back, 'con Shift+Tab, foco fuera de pantalla o tapado').toEqual([])
})

test('sin overflow horizontal ni errores en la sección', async ({ page }) => {
  await jumpTo(page, '#proyectos')
  await expectNoHorizontalOverflow(page)
})

test('axe y contraste AA en #proyectos, con un panel de arquitectura abierto', async ({ page }) => {
  const w = work(page)
  await jumpTo(page, '#proyectos')
  await waitForAnimationsToFinish(page)
  await expectNoA11yViolations(page, { include: '#proyectos' })
  await expectReadableContrast(page, '#proyectos')

  const btn = w.article('MyTube').getByRole('button', { name: 'Ver arquitectura' })
  await keyboardFocus(page, btn)
  await page.keyboard.press('Enter')
  await expect(page.locator('#more-mytube')).toBeVisible()
  await waitForAnimationsToFinish(page)
  await expectNoA11yViolations(page, { include: '#proyectos' })
  await expectReadableContrast(page, '#proyectos')
})

/* ---------------- Pin con rueda real, en los tamaños de escritorio pedidos ---------------- */

for (const size of [
  { width: 1440, height: 900, pinned: true },
  { width: 1024, height: 900, pinned: true },
  { width: 1440, height: 700, pinned: false },
]) {
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } })
    test.beforeEach(() => {
      test.skip(test.info().project.name !== 'desktop', 'Tamaño fijo: corre solo en el proyecto desktop')
    })

    test(`${size.pinned ? 'apila los casos con el pin' : 'sin apilado: lista'}; la bajada nunca queda tapada (rueda real)`, async ({ page }) => {
      test.setTimeout(120_000)
      const w = work(page)
      await expect(w.spacer).toHaveCount(size.pinned ? 1 : 0)

      // Entrar a la sección y recorrerla entera con la rueda
      const top = await page.evaluate(() => document.getElementById('proyectos').getBoundingClientRect().top + scrollY)
      await jumpTo(page, Math.round(top - 200))
      const covered = []
      const order = []
      let lastY = -1
      for (let i = 0; i < 60; i++) {
        const y = await wheelScroll(page, 160)
        for (const c of await findCoveredContent(page, '#proyectos', { selector: '#work-title, #work-title + p' })) covered.push(`scrollY ${y}: ${c}`)
        await expectNoHorizontalOverflow(page)
        const states = await caseStates(page)
        const shown = states.filter((s) => s.opacity > 0).map((s) => s.id)
        if (!order.length || order.at(-1).join() !== shown.join()) order.push(shown)
        // Ningún caso esperando captura el puntero
        for (const s of states) if (s.opacity === 0) expect(s.pointer, `${s.id} invisible pero clickeable`).toBe('none')
        const introBottom = (await w.intro.boundingBox())?.y ?? -1
        if (introBottom < -200 || y === lastY) break
        lastY = y
      }
      expect(covered, 'la bajada o el título quedaron tapados').toEqual([])

      if (size.pinned) {
        // Los casos entran de a uno y en orden
        expect(order.at(0)).toEqual(['mytube'])
        expect(order.at(-1)).toEqual(CASES.map((c) => c.id))
        for (let i = 1; i < order.length; i++) expect(order[i].length).toBeGreaterThanOrEqual(order[i - 1].length)
        // Al volver a mitad del pin, el caso de adelante es el último que entró
        const mid = Math.round(top + (await page.evaluate(() => innerHeight)) * 0.9 * 1.5)
        await jumpTo(page, mid)
        const states = await caseStates(page)
        const visible = states.filter((s) => s.opacity > 0)
        expect(visible.at(-1).front, 'el último caso que entró tiene que estar adelante').toBe(true)
      } else {
        // Lista: los cuatro visibles uno debajo del otro, sin transform
        const states = await caseStates(page)
        expect(states.every((s) => s.opacity === 1)).toBe(true)
        for (let i = 1; i < states.length; i++) expect(states[i].top).toBeGreaterThanOrEqual(states[i - 1].bottom - 1)
      }
    })

    test('con el panel de arquitectura abierto, el caso entra entero y nada lo tapa', async ({ page }) => {
      test.skip(!size.pinned, 'En lista el panel puede seguir debajo del pie: se desplaza normal')
      // stackFits() mide con los paneles cerrados: el panel abierto no puede agrandar el caso
      for (const { id } of CASES) {
        const btn = page.locator(`#case-${id} button[aria-controls^="more-"]`)
        await keyboardFocus(page, btn)
        await page.keyboard.press('Enter')
        await expect(page.locator(`#more-${id}`)).toBeVisible()
        await waitForAnimationsToFinish(page)
        const r = await page.evaluate((id) => {
          const panel = document.getElementById(`more-${id}`)
          const items = [...panel.querySelectorAll('h4, p, li')]
          const bad = items.filter((el) => {
            const b = el.getBoundingClientRect()
            const hit = document.elementFromPoint(b.left + Math.min(10, b.width / 2), b.top + b.height / 2)
            return b.bottom > innerHeight || b.top < 0 || !hit || !el.contains(hit)
          })
          return bad.map((el) => el.textContent.trim().slice(0, 30))
        }, id)
        expect(r, `${id}: texto del panel cortado o tapado`).toEqual([])
        await page.keyboard.press('Enter')
      }
    })
  })
}

/* ---------------- "Ver arquitectura" se trae a la vista al abrirse (useRevealOnOpen) ---------------- */
// Debajo de 1024 px el panel se abre debajo del texto del caso. Si no se ve entero, la página se
// desplaza lo justo (Lenis en 0,6 s; con movimiento reducido, de un salto) y lo deja debajo de la
// barra fija. El foco no se mueve: queda en el botón. Con los casos apilados no se mueve nada.

const isNarrowProject = () => (test.info().project.use.viewport?.width ?? 1440) < 1024

test.describe('mobile y tablet: el panel de arquitectura se trae a la vista', () => {
  test.beforeEach(() => {
    test.skip(!isNarrowProject(), 'Debajo de 1024 px el panel se abre debajo del texto del caso')
  })

  test('con el botón en el tercio de abajo, cada panel queda entero bajo la barra y el foco sigue en el botón', async ({ page }) => {
    const w = work(page)
    const vh = page.viewportSize().height
    for (const { id, name } of CASES) {
      const btn = w.article(name).getByRole('button', { name: /^Ver (arquitectura|resumen)$/ })
      const panel = page.locator(`#more-${id}`)
      const box = await placeAt(page, btn, 0.85)
      expect(box.y, `${name}: el botón quedó en el tercio de abajo`).toBeGreaterThan((vh * 2) / 3)
      const y0 = await waitForScrollSettled(page)

      await startScrollTrace(page)
      await btn.click()
      await expect(btn).toHaveAttribute('aria-expanded', 'true')
      await expectRevealed(panel, `${name}: panel de arquitectura`)
      await waitForScrollSettled(page)
      const trace = await scrollTrace(page)
      expect(trace.to - y0, `${name}: la página bajó hasta el panel`).toBeGreaterThan(40)
      if (isReducedProject()) expect(trace.steps, `${name}: reducido, un salto (${JSON.stringify(trace)})`).toBe(0)
      else expect(trace.steps, `${name}: con movimiento, animado (${JSON.stringify(trace)})`).toBeGreaterThan(3)
      await expect(btn, `${name}: el foco no se mueve al panel`).toBeFocused()
      await expect(btn).toBeInViewport() // el botón para cerrarlo sigue a la vista

      await btn.click() // cerrar antes del caso siguiente
      await expect(panel).toBeHidden()
    }
  })

  test('si el panel ya entra entero, la página no se mueve', async ({ page }) => {
    const w = work(page)
    const btn = w.article('Sistema de transporte').getByRole('button', { name: 'Ver arquitectura' })
    await placeAt(page, btn, 0.14)
    await waitForScrollSettled(page)
    await startScrollTrace(page)
    await btn.click()
    await expect(page.locator('#more-transporte')).toBeVisible()
    await waitForAnimationsToFinish(page, '#case-transporte')
    await waitForScrollSettled(page)
    await expectRevealed(page.locator('#more-transporte'), 'panel de transporte')
    const trace = await scrollTrace(page)
    expect(trace.maxDrift, `scrollY se movió (${JSON.stringify(trace)})`).toBeLessThan(1)
  })
})

/* Escritorio con los casos apilados: abrir el panel no mueve la página */
for (const size of [
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
]) {
  test.describe(`${size.width}×${size.height} apilado: el panel no mueve la página`, () => {
    test.use({ viewport: { width: size.width, height: size.height } })
    test.beforeEach(() => {
      test.skip(test.info().project.name !== 'desktop', 'Tamaño fijo: corre solo en el proyecto desktop')
    })

    test('abrir "Ver arquitectura" en cada caso no mueve scrollY', async ({ page }) => {
      await expect(work(page).spacer, 'hay pin (casos apilados)').toHaveCount(1)
      for (const { id, name } of CASES) {
        const btn = page.locator(`#case-${id}`).getByRole('button', { name: /^Ver (arquitectura|resumen)$/ })
        const panel = page.locator(`#more-${id}`)
        await keyboardFocus(page, btn) // trae el caso al frente del apilado
        await waitForAnimationsToFinish(page, '#proyectos')
        await waitForScrollSettled(page)
        await startScrollTrace(page)
        await page.keyboard.press('Enter')
        await expect(panel).toBeVisible()
        await waitForAnimationsToFinish(page, `#case-${id}`)
        await waitForScrollSettled(page)
        const trace = await scrollTrace(page)
        expect(trace.maxDrift, `${name}: scrollY se movió con los casos apilados (${JSON.stringify(trace)})`).toBeLessThan(1)
        await expect(panel, `${name}: el panel entra entero`).toBeInViewport({ ratio: 1 })
        await page.keyboard.press('Enter') // cerrar
        await expect(panel).toBeHidden()
      }
    })
  })
}

/* ---------------- Controles de cada caso (transporte-stack-fit, corregido) ---------------- */
// Corregido en Projects.module.css (columnas minmax(0, …), gaps y padding de los botones): a 1024
// los tres controles de transporte entran en una fila y el caso vuelve a entrar en el apilado.
// Sin pin a 1280×800, 1366×768 y 1536×864 es el comportamiento previo (no es un bug): se anota.
for (const size of [
  { width: 1024, height: 900, pinned: true },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900, pinned: true },
  { width: 1536, height: 864 },
]) {
  test.describe(`${size.width}×${size.height} controles`, () => {
    test.use({ viewport: { width: size.width, height: size.height } })
    test.beforeEach(() => {
      test.skip(test.info().project.name !== 'desktop', 'Tamaño fijo: corre solo en el proyecto desktop')
    })

    test('transporte en una fila, botones de 44 px y sin overflow', async ({ page }) => {
      const pin = await work(page).spacer.count()
      test.info().annotations.push({ type: 'pin', description: `${size.width}×${size.height}: ${pin ? 'apilado' : 'lista'}` })
      if (size.pinned) expect(pin, 'con pin').toBe(1)

      const rows = await page.evaluate(() =>
        Object.fromEntries(
          [...document.querySelectorAll('#proyectos article')].map((a) => {
            const controls = [...a.querySelectorAll('a, button[aria-expanded]')].map((el) => el.getBoundingClientRect())
            const tops = [...new Set(controls.map((r) => Math.round(r.top + r.height / 2)))]
            const rowsCount = tops.filter((t, i) => tops.findIndex((u) => Math.abs(u - t) < 12) === i).length
            const buttons = [...a.querySelectorAll('button[aria-expanded]')].map((b) => Math.round(b.getBoundingClientRect().height))
            return [a.id.replace('case-', ''), { rows: rowsCount, buttons }]
          }),
        ),
      )
      expect(rows.transporte.rows, `transporte: controles en ${rows.transporte.rows} filas`).toBe(1)
      if (size.width >= 1536) expect(rows.mytube.rows, 'MyTube en una fila a 1536').toBe(1)
      for (const [id, r] of Object.entries(rows)) {
        for (const h of r.buttons) expect(h, `${id}: alto de botón`).toBeGreaterThanOrEqual(44)
      }
      await jumpTo(page, '#proyectos')
      await expectNoHorizontalOverflow(page)
    })
  })
}

/* ---------------- Inclinación 3D solo con puntero fino ---------------- */

test('la inclinación 3D sigue al cursor solo con puntero fino', async ({ page }) => {
  test.skip(isReducedProject(), 'Sin movimiento no hay inclinación')
  const fine = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)
  const w = work(page)
  const a = w.article('MyTube')
  await jumpTo(page, '#proyectos')
  const box = await a.boundingBox()
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.2)
  await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.15, { steps: 5 })
  const transform = () => a.evaluate((el) => el.style.transform)
  if (fine) await expect.poll(transform).toMatch(/rotate[XY]\((?!0\.000deg)/)
  else expect(await transform()).not.toMatch(/rotate[XY]\((?!0\.000deg)/)
})

/* ---------------- Movimiento reducido ---------------- */

test.describe('movimiento reducido', () => {
  test.beforeEach(() => {
    test.skip(!isReducedProject(), 'Solo en los proyectos *-reduced')
  })

  test('sin pin ni apilado: los cuatro casos visibles en lista y sin transform', async ({ page }) => {
    const w = work(page)
    await expect(w.spacer).toHaveCount(0)
    await jumpTo(page, '#proyectos')
    const states = await caseStates(page)
    expect(states.map((s) => s.opacity)).toEqual([1, 1, 1, 1])
    for (let i = 1; i < states.length; i++) expect(states[i].top).toBeGreaterThanOrEqual(states[i - 1].bottom - 1)
    const transforms = await w.section.locator('article').evaluateAll((els) => els.map((el) => el.style.transform))
    expect(transforms.every((t) => t === '')).toBe(true)
    const y0 = await scrollY(page)
    const y1 = await wheelScroll(page, 400)
    expect(y1 - y0, 'sin pin, la rueda desplaza normal').toBeGreaterThan(350)
  })
})
