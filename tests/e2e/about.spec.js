// Perfil (#perfil): src/features/about.
//
// h2 "Negocio, datos y código.", declaración palabra por palabra (cada palabra en un span, los
// espacios afuera), dl con Base / Formación / Programo desde, tres principios (li + h3) y el IN
// sticky decorativo. Con movimiento, las palabras pasan de --soft a --ink con el scroll (ScrollTrigger
// de top 85% a bottom 45%); con movimiento reducido, todas en tinta desde el arranque.
import {
  test,
  expect,
  waitForAppReady,
  waitForAnimationsToFinish,
  wheelScroll,
  jumpTo,
  expectNoHorizontalOverflow,
  expectNoA11yViolations,
  expectReadableContrast,
  measureTextContrast,
  findCoveredContent,
} from './helpers/index.js'

const STATEMENT =
  'Estudio cómo la tecnología resuelve problemas de negocio, y programo desde 2023 para poder construir esas soluciones yo mismo.'
const FACTS = [
  ['Base', 'CABA, Buenos Aires'],
  ['Formación', 'UADE, Lic. en Gestión de TI'],
  ['Programo desde', '2023'],
]
const PRINCIPLES = ['Primero, el problema.', 'Piezas con una sola tarea.', 'Aprender y explicar.']

const isReducedProject = () => test.info().project.use.reducedMotion === 'reduce'

// BUG theme-mix-contrast (abierto): con movimiento, src/features/stage/engine/theme.js:84-99
// interpola en RGB --bg, --ink y --soft durante MIX_WINDOW (28 % de la pantalla) en cada cambio de
// tema; a mitad de la mezcla texto y fondo convergen (peor medido: 1.18:1 en 1440, scrollY ≈ 1760).
// La cabecera ya lo evita con un tema discreto; el contenido no.
const THEME_MIX_BUG = 'BUG theme-mix-contrast: theme.js:84 mezcla texto y fondo en RGB y el contraste cae a ~1.2:1'

/** true cuando la mezcla de tema terminó (las variables vivas de <html> ya son las del tema claro). */
const themeSettledLight = (page) =>
  page.evaluate(() => {
    const live = document.documentElement.style.getPropertyValue('--bg').trim()
    if (!live) return true
    const probe = document.createElement('span')
    probe.style.color = 'var(--light-bg)'
    document.body.appendChild(probe)
    const light = getComputedStyle(probe).color
    probe.style.color = live
    const now = getComputedStyle(probe).color
    probe.remove()
    return light === now
  })

/** @param {import('@playwright/test').Page} page */
const perfil = (page) => {
  const section = page.locator('#perfil')
  return {
    section,
    h2: section.getByRole('heading', { level: 2, name: 'Negocio, datos y código.', exact: true }),
    statement: section.getByRole('paragraph').filter({ hasText: /^Estudio cómo/ }),
    mono: section.locator('[data-stage-pose]'),
  }
}

/**
 * Estado del reveal: cuántas palabras están en tinta (color == --ink resuelto) y la posición del
 * párrafo respecto del viewport.
 */
const revealState = (page) =>
  page.evaluate(() => {
    const p = [...document.querySelectorAll('#perfil p')].find((x) => x.textContent.startsWith('Estudio'))
    const probe = document.createElement('span')
    probe.style.color = 'var(--ink)'
    p.appendChild(probe)
    const ink = getComputedStyle(probe).color
    probe.remove()
    const words = [...p.querySelectorAll('span')]
    const r = p.getBoundingClientRect()
    return {
      total: words.length,
      // Estado del reveal: la clase que pone useWordReveal (CSS module "_on_…"). No depende de la
      // transición de color ni de la mezcla de tema.
      on: words.filter((w) => [...w.classList].some((c) => /^_?on(_|$)/.test(c))).length,
      // Color efectivo en tinta (para el modo reducido, donde no hay clase)
      ink: words.filter((w) => getComputedStyle(w).color === ink).length,
      docTop: r.top + scrollY,
      vh: innerHeight,
      top: r.top / innerHeight,
      bottom: r.bottom / innerHeight,
    }
  })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)
})

test('estructura: un h2, la declaración, la dl con 3 pares y 3 principios con h3', async ({ page }) => {
  const s = perfil(page)
  await expect(s.section.getByRole('heading', { level: 2 })).toHaveCount(1)
  await expect(s.h2).toBeAttached()

  // dl con tres pares dt/dd, en orden
  await expect(s.section.locator('dl dt')).toHaveText(FACTS.map(([dt]) => dt))
  await expect(s.section.locator('dl dd')).toHaveText(FACTS.map(([, dd]) => dd))
  await expect(s.section.getByRole('term')).toHaveCount(3)
  await expect(s.section.getByRole('definition')).toHaveCount(3)

  // Principios: una lista de tres ítems, cada uno con su h3
  const items = s.section.getByRole('list').getByRole('listitem')
  await expect(items).toHaveCount(3)
  await expect(s.section.getByRole('heading', { level: 3 })).toHaveText(PRINCIPLES)
  for (let i = 0; i < 3; i++) await expect(items.nth(i).getByRole('heading', { level: 3 })).toHaveText(PRINCIPLES[i])

  // La región se anuncia con el título y el IN no aparece en el árbol
  await expect(s.section).toMatchAriaSnapshot(`
    - region "Negocio, datos y código.":
      - heading "Negocio, datos y código." [level=2]
      - paragraph: ${STATEMENT}
      - term: Base
      - definition: CABA, Buenos Aires
      - term: Formación
      - definition: UADE, Lic. en Gestión de TI
      - term: Programo desde
      - definition: "2023"
      - paragraph: /^Combino programación/
      - list:
        - listitem:
          - heading "${PRINCIPLES[0]}" [level=3]
          - paragraph
        - listitem:
          - heading "${PRINCIPLES[1]}" [level=3]
          - paragraph
        - listitem:
          - heading "${PRINCIPLES[2]}" [level=3]
          - paragraph
  `)
})

test('la declaración está completa, con espacios entre palabras y una palabra por span', async ({ page }) => {
  const s = perfil(page)
  await expect(s.statement).toHaveCount(1)
  const info = await s.statement.evaluate((p) => ({
    text: p.textContent,
    rendered: p.innerText.replace(/\s+/g, ' ').trim(),
    words: [...p.querySelectorAll('span')].map((w) => w.textContent),
    spacesInsideSpans: [...p.querySelectorAll('span')].filter((w) => /\s/.test(w.textContent)).length,
  }))
  expect(info.text, 'texto completo en el DOM (lo que lee un lector de pantalla)').toBe(STATEMENT)
  expect(info.rendered, 'texto renderizado, sin palabras pegadas').toBe(STATEMENT)
  expect(info.words).toEqual(STATEMENT.split(' '))
  expect(info.words.every((w) => w.length > 0)).toBe(true)
  expect(info.spacesInsideSpans).toBe(0)
  // El nombre accesible del párrafo (lo que expone el árbol) es la oración entera
  await expect(s.section.getByRole('paragraph', { name: undefined }).first()).toHaveText(STATEMENT)
})

test('el IN es decorativo: aria-hidden, sin capturar el puntero y fijo mientras se lee', async ({ page }) => {
  const s = perfil(page)
  await expect(s.mono).toHaveAttribute('aria-hidden', 'true')
  const style = await s.mono.evaluate((el) => {
    const cs = getComputedStyle(el)
    return { pointerEvents: cs.pointerEvents, position: cs.position, focusables: el.querySelectorAll('a, button, [tabindex]').length }
  })
  expect(style.pointerEvents).toBe('none')
  expect(style.focusables).toBe(0)

  if (style.position === 'sticky') {
    // Con el texto del perfil a la vista, bajar un poco no mueve el IN
    await jumpTo(page, '#perfil')
    await wheelScroll(page, 200)
    const a = (await s.mono.boundingBox()).y
    await wheelScroll(page, 200)
    const b = (await s.mono.boundingBox()).y
    expect(Math.abs(a - b), 'el IN sticky tendría que quedarse quieto').toBeLessThanOrEqual(2)
  }
})

test.describe('con movimiento', () => {
  test.beforeEach(() => {
    test.skip(isReducedProject(), 'El reveal solo existe con movimiento')
  })

  test('con la rueda, las palabras pasan a tinta de a poco y vuelven al subir', async ({ page }) => {
    const s = perfil(page)
    let st = await revealState(page)
    expect(st.total).toBe(STATEMENT.split(' ').length)
    // Arrancamos un poco antes del 85 % y seguimos con la rueda real
    await jumpTo(page, Math.round(st.docTop - st.vh))
    st = await revealState(page)
    let before = st
    for (let i = 0; i < 20 && st.top > 0.85; i++) {
      before = st
      await wheelScroll(page, 60)
      st = await revealState(page)
    }
    expect(before.top).toBeGreaterThan(0.85)
    expect(before.on, 'antes de cruzar el 85 % no hay palabras en tinta').toBe(0)

    // Avanzar en pasos chicos registrando cuántas palabras están encendidas
    const seen = [st.on]
    for (let i = 0; i < 40 && st.on < st.total; i++) {
      await wheelScroll(page, 80)
      st = await revealState(page)
      seen.push(st.on)
    }
    expect(st.on, 'al pasar el 45 % todas en tinta').toBe(st.total)
    for (let i = 1; i < seen.length; i++) expect(seen[i], `retroceso en el paso ${i}: ${seen}`).toBeGreaterThanOrEqual(seen[i - 1])
    const partial = new Set(seen.filter((n) => n > 0 && n < st.total))
    expect(partial.size, `progresivo, no de golpe: ${seen}`).toBeGreaterThanOrEqual(3)

    // Con todo encendido, el color efectivo es el de la tinta
    await waitForAnimationsToFinish(page, '#perfil')
    expect((await revealState(page)).ink).toBe(st.total)

    // Scrub reversible: al subir, vuelven a gris
    await wheelScroll(page, -400)
    expect((await revealState(page)).on).toBeLessThan(st.total)
    await expect(s.statement).toHaveText(STATEMENT) // el texto nunca cambia
  })

  test('axe y contraste AA en #perfil con palabras grises y con todo en tinta', async ({ page }) => {
    // Puntos fijos del reveal, con el tema ya asentado (la mezcla de tema la cubre el barrido)
    const st0 = await revealState(page)
    const at = async (frac) => {
      await jumpTo(page, Math.round(st0.docTop - frac * st0.vh))
      await waitForAnimationsToFinish(page)
      return revealState(page)
    }
    let st = await at(0.62) // la declaración a mitad de su recorrido
    for (let f = 0.58; f > 0.3 && !(st.on > 0 && st.on < st.total && (await themeSettledLight(page))); f -= 0.04) st = await at(f)
    expect(st.on, 'tendría que haber palabras grises').toBeLessThan(st.total)
    expect(st.on).toBeGreaterThan(0)
    expect(await themeSettledLight(page), 'el tema tendría que estar asentado').toBe(true)
    await expectNoA11yViolations(page, { include: '#perfil' })
    await expectReadableContrast(page, '#perfil') // axe no lo mide con el canvas detrás

    st = await at(0.1) // ya pasó el 45 %: todo en tinta
    expect(st.on).toBe(st.total)
    await expectNoA11yViolations(page, { include: '#perfil' })
    await expectReadableContrast(page, '#perfil')
  })
})

test.describe('movimiento reducido', () => {
  test.beforeEach(() => {
    test.skip(!isReducedProject(), 'Solo en los proyectos *-reduced')
  })

  test('todas las palabras en tinta desde el arranque, sin esperar el scroll', async ({ page }) => {
    let st = await revealState(page)
    expect(st.ink).toBe(st.total)
    await wheelScroll(page, 300)
    st = await revealState(page)
    expect(st.ink).toBe(st.total)
  })

  test('axe y contraste AA en #perfil', async ({ page }) => {
    await jumpTo(page, '#perfil')
    await waitForAnimationsToFinish(page)
    await expectNoA11yViolations(page, { include: '#perfil' })
    await expectReadableContrast(page, '#perfil')
  })
})

test('contraste AA del texto visible en las mezclas de tema inicio → Perfil → Proyectos', async ({ page }) => {
  test.setTimeout(90_000)
  test.fail(!isReducedProject(), THEME_MIX_BUG)
  // theme.js: cada capítulo toma su tema cuando su borde cruza el 55 % de la pantalla, con una
  // mezcla del 28 % de la pantalla centrada ahí. Barremos esa banda en pasos de 20 px.
  const bands = await page.evaluate(() =>
    ['perfil', 'proyectos'].map((id) => {
      const top = document.getElementById(id).getBoundingClientRect().top + scrollY
      const stop = top - innerHeight * 0.55
      return { id, from: Math.round(stop - innerHeight * 0.16), to: Math.round(stop + innerHeight * 0.16) }
    }),
  )
  const failures = []
  for (const band of bands) {
    for (let y = band.from; y <= band.to; y += 20) {
      await jumpTo(page, y)
      await waitForAnimationsToFinish(page)
      for (const root of ['#inicio', '#perfil', '#proyectos']) {
        for (const x of await measureTextContrast(page, root)) if (x.ratio < x.required) failures.push({ y, band: band.id, ...x })
      }
    }
  }
  const worst = [...failures].sort((a, b) => a.ratio - b.ratio).slice(0, 5)
  expect(
    failures.length,
    `texto bajo AA en ${new Set(failures.map((f) => f.y)).size} posición(es); peores:\n` +
      worst.map((f) => `  scrollY ${f.y} (→ ${f.band}): ${f.ratio}:1 "${f.text}" ${f.fg} sobre ${f.bg}`).join('\n'),
  ).toBe(0)
})

test('continuidad inicio → Perfil → Proyectos: nada tapado, sin superposición ni overflow', async ({ page }) => {
  const s = perfil(page)
  const proyectosH2 = page.getByRole('heading', { level: 2, name: 'Proyectos', exact: true })
  const problems = []
  for (let i = 0; i < 60; i++) {
    await wheelScroll(page, 250)
    for (const root of ['#perfil', '#proyectos']) {
      for (const c of await findCoveredContent(page, root)) problems.push(`scrollY ${await page.evaluate(() => Math.round(scrollY))}: ${c}`)
    }
    await expectNoHorizontalOverflow(page)
    // Perfil no se superpone con el inicio ni con Proyectos
    const order = await page.evaluate(() => {
      const box = (id) => document.getElementById(id).getBoundingClientRect()
      const spacer = document.querySelector('#inicio .pin-spacer') ?? document.getElementById('inicio')
      return {
        heroBottom: spacer.getBoundingClientRect().bottom,
        perfilTop: box('perfil').top,
        perfilBottom: box('perfil').bottom,
        proyectosTop: box('proyectos').top,
      }
    })
    expect(order.heroBottom, 'el inicio se mete en Perfil').toBeLessThanOrEqual(order.perfilTop + 1)
    expect(order.perfilBottom, 'Perfil se mete en Proyectos').toBeLessThanOrEqual(order.proyectosTop + 1)
    const h = await proyectosH2.boundingBox()
    if (h && h.y < (page.viewportSize()?.height ?? 800) * 0.4) break
  }
  expect(problems, 'contenido tapado').toEqual([])
  await expect(s.h2).not.toBeInViewport()
})
