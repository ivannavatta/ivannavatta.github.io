// Stack (#stack): src/features/skills.
//
// h2 "Stack, por capas", bajada y cinco capas (h3 + lista). Cada tecnología es un <button> con
// su uso en el nombre accesible (texto sr-only). El panel "Dónde la usé" es visual (aria-hidden):
// se actualiza con el foco, el clic y, con puntero fino, el hover; al salir de las capas el panel
// conserva la última tecnología. Cada botón es un bloque de la pose "stack" del IN
// (data-stage-block): con escena viva el botón es transparente y el bloque lo dibuja el canvas
// detrás; con movimiento reducido (o sin WebGL) es una teja plana con fondo --tile. El hover/foco
// avisa a la escena con el evento `stage:hover` { pose: 'stack', index } para elevar el bloque.
import {
  test,
  expect,
  waitForAppReady,
  waitForAnimationsToFinish,
  waitForScrollSettled,
  wheelScroll,
  jumpTo,
  nextFrames,
  expectNoHorizontalOverflow,
  expectWithinViewportX,
  expectTargetSize,
  expectNoA11yViolations,
  expectReadableContrast,
  expectVisibleFocus,
  keyboardFocus,
  dominantColor,
  colorDistance,
  contrastRatio,
  parseRgb,
} from './helpers/index.js'

const TITLE = 'Stack, por capas'
const LEAD = 'Cada bloque es una tecnología. Pasá el cursor o recorrelos con Tab para ver dónde la usé.'
const DETAIL = { title: 'Dónde la usé', hint: 'Elegí un bloque para ver en qué proyecto o curso usé esa tecnología.' }

// Contrato de contenido (src/features/skills/i18n/es.js): `use` va al panel y `sr` al nombre
// accesible del botón. Si cambia el copy, se actualiza acá.
const LAYERS = [
  {
    name: 'Interfaz',
    tiles: [
      ['HTML', 'Coderhouse, Desarrollo Web (2023), y la interfaz de MyTube.', 'Coderhouse, Desarrollo Web (2023), y la interfaz de MyTube.'],
      ['CSS', 'Coderhouse, Desarrollo Web (2023), y los estilos de MyTube junto a MUI y React-Bootstrap.', 'Coderhouse, Desarrollo Web (2023), y los estilos de MyTube.'],
      ['JavaScript', 'Coderhouse, curso de JavaScript (2023), y la base de todo el frontend de MyTube.', 'Coderhouse, curso de JavaScript (2023), y el frontend de MyTube.'],
      ['React', 'MyTube, con React 18 y TypeScript, y el curso React Js de Coderhouse, donde quedé en el Top 10.', 'MyTube y el curso React Js de Coderhouse, Top 10 del curso.'],
      ['TypeScript', 'MyTube, en el frontend y en el backend con Express.', 'MyTube, frontend y backend.'],
    ],
  },
  {
    name: 'Backend',
    tiles: [
      ['Java', 'Sistema de transporte, Programación II en UADE: TDA propios y excepciones.', 'Sistema de transporte, Programación II en UADE.'],
      ['Python', 'uadeHUB y box9, proyectos de UADE.', 'uadeHUB y box9, proyectos de UADE.'],
      ['Node.js y Express', 'Backend de MyTube y el curso Programación Backend de Coderhouse (2024, 94 horas).', 'backend de MyTube y curso Programación Backend de Coderhouse.'],
    ],
  },
  {
    name: 'Datos',
    tiles: [
      ['SQL', 'Bases de datos en la cursada de UADE.', 'bases de datos en la cursada de UADE.'],
      ['MongoDB', 'MyTube, con Mongoose, DAO y DTO, y el curso Programación Backend de Coderhouse.', 'MyTube y curso Programación Backend de Coderhouse.'],
    ],
  },
  {
    name: 'Herramientas',
    tiles: [
      ['Git', 'Todos los proyectos de esta página.', 'todos los proyectos.'],
      ['GitHub', 'Repositorios públicos de MyTube, uadeHUB y box9.', 'repositorios de MyTube, uadeHUB y box9.'],
      ['VS Code', 'Mi editor de todos los días.', 'editor de todos los días.'],
      ['Figma', 'Bocetos de interfaces antes de programarlas.', 'bocetos de interfaces.'],
      ['UML', 'Modelado de sistemas en la cursada de UADE.', 'modelado de sistemas en UADE.'],
    ],
  },
  {
    name: 'Método',
    tiles: [
      ['Scrum', 'Gestión de proyectos en la cursada de UADE.', 'gestión de proyectos en UADE.'],
      ['Análisis de sistemas', 'Relevamiento y modelado en la cursada de UADE.', 'relevamiento y modelado en UADE.'],
    ],
  },
]
const TILES = LAYERS.flatMap((l) => l.tiles.map(([name, use, sr]) => ({ name, use, sr, layer: l.name })))

const isReducedProject = () => test.info().project.use.reducedMotion === 'reduce'
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Nombre accesible del botón: "<tecnología>: <uso>" (Chromium mete un espacio antes de los dos puntos). */
const tileName = (t) => new RegExp(`^${escape(t.name)}\\s*:\\s*${escape(t.sr)}$`)

/** @param {import('@playwright/test').Page} page */
const stack = (page) => {
  const section = page.locator('#stack')
  const panel = section.locator('[aria-hidden="true"]')
  return {
    section,
    h2: section.getByRole('heading', { level: 2, name: TITLE, exact: true }),
    pose: section.locator('[data-stage-pose="stack"]'),
    panel,
    panelName: panel.locator('p').nth(0),
    panelUse: panel.locator('p').nth(1),
    tile: (t) => section.getByRole('button', { name: tileName(t) }),
    tiles: section.getByRole('button'),
  }
}

/** El panel muestra la tecnología `t` (o el estado inicial si `t` es null). */
async function expectPanel(s, t) {
  await expect(s.panelName).toHaveText(t ? t.name : DETAIL.title)
  await expect(s.panelUse).toHaveText(t ? t.use : DETAIL.hint)
}

/** Avisos `stage:hover` de la pose stack que recibió la escena (índices, en orden). */
const stageHovers = (page) => page.evaluate(() => (window.__stageHovers ?? []).filter((d) => d.pose === 'stack').map((d) => d.index))

/** ¿Algún botón tiene la clase de tecla activa? (CSS module "_active_…") */
const activeTiles = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('#stack [data-stage-block]')]
      .map((b, i) => ([...b.classList].some((c) => /^_?active(_|$)/.test(c)) ? i : -1))
      .filter((i) => i >= 0),
  )

/**
 * ¿El elemento con foco se ve? Fracción de su alto que queda en pantalla y debajo de la cabecera,
 * y si el centro de esa parte visible lo recibe el propio elemento (nada encima).
 * WCAG 2.4.11 (AA) pide que el foco no quede del todo tapado; acá se exige al menos la mitad.
 */
const focusedVisibility = (page) =>
  page.evaluate(() => {
    const el = document.activeElement
    const r = el.getBoundingClientRect()
    const header = Math.max(0, document.querySelector('header')?.getBoundingClientRect().bottom ?? 0)
    const visTop = Math.max(r.top, header)
    const visBottom = Math.min(r.bottom, innerHeight)
    const shown = r.height ? Math.max(0, visBottom - visTop) / r.height : 0
    const top = shown > 0 ? document.elementFromPoint(r.left + r.width / 2, (visTop + visBottom) / 2) : null
    return {
      inStack: !!el.closest('#stack'),
      shown: Math.round(shown * 100) / 100,
      onTop: !!top && el.contains(top),
      where: `top ${Math.round(r.top)}, bottom ${Math.round(r.bottom)}, cabecera ${Math.round(header)}, alto ${innerHeight}`,
    }
  })

/**
 * Lleva el scroll a una posición en la que la pose "stack" está asentada (stage.js: el morph
 * visor→stack termina con #stack en top 15 % y el stack→path arranca con #recorrido en top 85 %)
 * y el botón `index` queda lo más centrado posible. Devuelve la caja del botón, o null si no entra
 * entero en pantalla con la pose asentada.
 */
async function showTileSettled(page, index) {
  const y = await page.evaluate((index) => {
    const vh = innerHeight
    const st = document.getElementById('stack').getBoundingClientRect()
    const S = st.top + scrollY
    const R = S + st.height
    const b = document.querySelectorAll('#stack [data-stage-block]')[index].getBoundingClientRect()
    const want = b.top + scrollY + b.height / 2 - vh / 2
    const lo = S - 0.15 * vh + 40
    const hi = R - 0.85 * vh - 40
    return Math.round(Math.min(Math.max(want, lo), hi))
  }, index)
  await jumpTo(page, y)
  await nextFrames(page, 10)
  return page.evaluate((index) => {
    const b = document.querySelectorAll('#stack [data-stage-block]')[index].getBoundingClientRect()
    const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0
    if (b.top < header + 2 || b.bottom > innerHeight - 2) return null
    return { x: b.left, y: b.top, width: b.width, height: b.height }
  }, index)
}

/** true con escena viva (Lenis + WebGL): las teclas son transparentes y el bloque es del canvas. */
const isLiveGl = (page) =>
  page.evaluate(() => document.documentElement.classList.contains('live') && document.documentElement.classList.contains('gl'))

/** Color resuelto de una variable CSS ("rgb(…)"). */
const cssVarColor = (page, name) =>
  page.evaluate((name) => {
    const probe = document.createElement('span')
    probe.style.color = `var(${name})`
    document.body.appendChild(probe)
    const c = getComputedStyle(probe).color
    probe.remove()
    return c
  }, name)

/** Fondo, color y tamaño del texto de un botón, con el umbral AA que le toca (3 si es texto grande). */
const textStyle = (locator) =>
  locator.evaluate((el) => {
    const cs = getComputedStyle(el)
    const size = parseFloat(cs.fontSize)
    const weight = Number(cs.fontWeight)
    return { bg: cs.backgroundColor, color: cs.color, size: Math.round(size * 10) / 10, required: size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5 }
  })

/** Pone el puntero fuera de las capas (margen izquierdo, a media altura). */
const pointerAway = async (page) => {
  const vp = page.viewportSize()
  await page.mouse.move(4, Math.round(vp.height / 2))
}

test.beforeEach(async ({ page }) => {
  // Registro de los avisos a la escena (init script: la CSP no lo bloquea)
  await page.addInitScript(() => {
    window.__stageHovers = []
    window.addEventListener('stage:hover', (e) => window.__stageHovers.push(e.detail))
  })
  await page.goto('/')
  await waitForAppReady(page)
})

/* ---------------- Estructura y nombres accesibles (todos los proyectos) ---------------- */

test('estructura: un h2, la bajada, cinco capas con h3 y lista, y 17 tecnologías como botón', async ({ page }) => {
  const s = stack(page)
  await expect(s.section).toHaveAttribute('aria-labelledby', 'stack-title')
  await expect(s.section.getByRole('heading', { level: 2 })).toHaveCount(1)
  await expect(s.h2).toHaveId('stack-title')
  await expect(s.section.getByRole('paragraph').filter({ hasText: /^Cada bloque/ })).toHaveText(LEAD)

  // Cinco capas, en orden, cada una con su h3 y una lista con sus tecnologías
  await expect(s.section.getByRole('heading', { level: 3 })).toHaveText(LAYERS.map((l) => l.name))
  await expect(s.section.getByRole('list')).toHaveCount(LAYERS.length)
  for (const [i, layer] of LAYERS.entries()) {
    const list = s.section.getByRole('list').nth(i)
    await expect(list.getByRole('listitem'), layer.name).toHaveCount(layer.tiles.length)
    await expect(list.getByRole('button')).toHaveText(layer.tiles.map(([name, , sr]) => new RegExp(`^${escape(name)}\\s*:\\s*${escape(sr)}$`)))
  }

  // Cada tecnología: botón type=button, nombre "<tecnología>: <uso>", y lo visible es solo el nombre
  await expect(s.tiles).toHaveCount(TILES.length)
  for (const t of TILES) {
    const btn = s.tile(t)
    await expect(btn, t.name).toHaveCount(1)
    await expect(btn).toHaveAttribute('type', 'button')
    await expect(btn).toHaveAccessibleName(tileName(t))
    const visible = await btn.evaluate((el) => {
      const sr = el.querySelector('span')
      const r = sr?.getBoundingClientRect()
      return {
        own: [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim(),
        srText: sr?.textContent ?? '',
        srClipped: !!r && r.width <= 1 && r.height <= 1,
      }
    })
    expect(visible.own, `${t.name}: texto visible`).toBe(t.name)
    expect(visible.srText, `${t.name}: uso para lectores de pantalla`).toMatch(new RegExp(`^:\\s*${escape(t.sr)}$`))
    expect(visible.srClipped, `${t.name}: el uso es sr-only (no se ve)`).toBe(true)
  }

  // Árbol de accesibilidad de la región: el panel y los bloques del IN no aparecen
  await expect(s.section).toMatchAriaSnapshot(`
    - region "${TITLE}":
      - heading "${TITLE}" [level=2]
      - paragraph: ${LEAD}
${LAYERS.map(
  (l) => `      - heading "${l.name}" [level=3]
      - list:
${l.tiles.map(([name, , sr]) => `        - listitem:\n          - button /^${escape(name)}\\s*:\\s*${escape(sr).replace(/\//g, '\\/')}$/`).join('\n')}`,
).join('\n')}
  `)
})

test('el panel "Dónde la usé" es visual: aria-hidden, sin nada enfocable y con el estado inicial', async ({ page }) => {
  const s = stack(page)
  await expect(s.panel).toHaveCount(1)
  await expect(s.panel).toHaveAttribute('aria-hidden', 'true')
  await expectPanel(s, null)
  expect(await s.panel.evaluate((el) => el.querySelectorAll('a, button, input, [tabindex]').length)).toBe(0)
  // Ni live region: la información llega por el nombre del botón, sin anuncios a cada movimiento
  await expect(s.section.locator('[aria-live], [role="status"], [role="log"]')).toHaveCount(0)
})

/* ---------------- Teclado: foco, panel y recorrido sin trampas ---------------- */

test('Tab recorre las 17 tecnologías en orden: foco visible, en pantalla, panel y escena al día', async ({ page }) => {
  test.setTimeout(90_000) // 17 pasos con la escena WebGL viva y 3 workers
  const s = stack(page)
  const first = s.tile(TILES[0])
  await keyboardFocus(page, first)

  const problems = []
  const partial = []
  for (const [i, t] of TILES.entries()) {
    const btn = s.tile(t)
    await expect(btn, `Tab ${i}: ${t.name}`).toBeFocused()
    await expectVisibleFocus(btn)
    await expectPanel(s, t)
    await expect.poll(() => activeTiles(page), { message: `${t.name} marcada como activa` }).toEqual([i])
    await waitForScrollSettled(page, { stableFrames: 3, epsilon: 1 })
    const f = await focusedVisibility(page)
    if (f.shown < 0.5 || !f.onTop) problems.push(`${t.name}: visible ${f.shown * 100} %, onTop=${f.onTop} (${f.where})`)
    else if (f.shown < 1) partial.push(`${t.name}: visible ${f.shown * 100} % (${f.where})`)
    await page.keyboard.press('Tab')
  }
  expect(problems, 'foco fuera de pantalla, debajo de la cabecera o tapado').toEqual([])
  // El navegador no desplaza si la tecla ya se ve en parte: queda anotado (2.4.12 AAA), no falla
  for (const p of partial) test.info().annotations.push({ type: 'foco cortado por el borde', description: p })

  // Después de la última, el foco sale de #stack (no hay trampa) y el bloque baja
  const out = await focusedVisibility(page)
  expect(out.inStack, 'el foco tendría que haber salido de #stack').toBe(false)
  await expect.poll(() => activeTiles(page)).toEqual([])
  await expectPanel(s, TILES.at(-1)) // el panel conserva la última tecnología

  // La escena recibió un aviso por tecnología, en orden, y al salir uno de "bajar" (-1)
  expect(await stageHovers(page)).toEqual([...TILES.map((_, i) => i), -1])
})

test('Shift+Tab recorre las tecnologías al revés y sale de #stack por arriba', async ({ page }) => {
  test.setTimeout(90_000)
  const s = stack(page)
  await keyboardFocus(page, s.tile(TILES.at(-1)))
  for (let i = TILES.length - 1; i >= 0; i--) {
    await expect(s.tile(TILES[i]), `Shift+Tab ${i}`).toBeFocused()
    await expectVisibleFocus(s.tile(TILES[i]))
    await expectPanel(s, TILES[i])
    await page.keyboard.press('Shift+Tab')
  }
  expect((await focusedVisibility(page)).inStack, 'el foco tendría que haber salido de #stack por arriba').toBe(false)
  // Y vuelve a entrar con Tab en la primera
  await page.keyboard.press('Tab')
  await expect(s.tile(TILES[0])).toBeFocused()
})

test('Enter y Espacio sobre una tecnología la muestran en el panel', async ({ page }) => {
  const s = stack(page)
  const react = TILES.find((t) => t.name === 'React')
  const sql = TILES.find((t) => t.name === 'SQL')
  await keyboardFocus(page, s.tile(react))
  await expectPanel(s, react)
  await s.tile(sql).focus()
  await page.keyboard.press('Enter')
  await expectPanel(s, sql)
  await page.keyboard.press('Space')
  await expectPanel(s, sql)
  await expect(s.tile(sql)).toBeFocused()
})

/* ---------------- Puntero: hover (fino) o toque (grueso) ---------------- */

test('el puntero actualiza el panel: hover con puntero fino, toque/clic con puntero grueso', async ({ page }) => {
  const s = stack(page)
  const fine = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)
  await jumpTo(page, '#stack')

  if (fine) {
    for (const [i, t] of TILES.entries()) {
      const btn = s.tile(t)
      await btn.hover()
      await expectPanel(s, t)
      await expect.poll(() => activeTiles(page), { message: `${t.name} activa con el cursor` }).toEqual([i])
    }
    // El cursor sale de las capas: el bloque baja, el panel conserva la última
    await pointerAway(page)
    await expect.poll(() => activeTiles(page)).toEqual([])
    await expectPanel(s, TILES.at(-1))
    const events = await stageHovers(page)
    expect(events.at(-1), 'al salir, la escena recibe "bajar" (-1)').toBe(-1)
    expect(events.filter((i) => i >= 0)).toEqual(TILES.map((_, i) => i))
  } else {
    // Sin hover: pasar por encima no cambia nada; tocar sí
    const box = await s.tile(TILES[1]).boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await expectPanel(s, null)
    for (const t of [TILES[1], TILES[8], TILES.at(-1)]) {
      const btn = s.tile(t)
      if (test.info().project.use.hasTouch) await btn.tap()
      else await btn.click()
      await expectPanel(s, t)
    }
  }
})

/* ---------------- El IN desarmado detrás de cada tecnología ---------------- */

test('el IN detrás de las teclas es decorativo: aria-hidden, sin puntero y un bloque por botón', async ({ page }) => {
  const s = stack(page)
  // Un bloque de la pose por tecnología, y cada bloque es el propio botón (no hay capas extra)
  const blocks = s.pose.locator('[data-stage-block]')
  await expect(blocks).toHaveCount(TILES.length)
  expect(await blocks.evaluateAll((els) => els.every((el) => el.tagName === 'BUTTON'))).toBe(true)
  // La pose contiene los botones: no puede estar oculta para la accesibilidad
  expect(await s.pose.evaluate((el) => !!el.closest('[aria-hidden="true"], [inert]'))).toBe(false)

  // Lo que dibuja el IN (canvas), las trazas y las costuras: decorativo y sin puntero
  // Stage.jsx monta, después de <main>, el canvas y a continuación las costuras y las trazas
  const decor = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const layers = [canvas, canvas?.nextElementSibling, canvas?.nextElementSibling?.nextElementSibling]
    return layers
      .filter(Boolean)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        hidden: el.getAttribute('aria-hidden'),
        pointer: getComputedStyle(el).pointerEvents,
        focusables: el.querySelectorAll('a, button, input, [tabindex]').length,
        tabindex: el.getAttribute('tabindex'),
      }))
  })
  expect(decor.map((d) => d.tag), 'canvas del IN, costuras y trazas').toEqual(['canvas', 'div', 'svg'])
  for (const d of decor) {
    expect(d.hidden, `${d.tag} decorativo`).toBe('true')
    expect(d.pointer, `${d.tag} no captura el puntero`).toBe('none')
    expect(d.focusables + (d.tabindex ? 1 : 0), `${d.tag} sin nada enfocable`).toBe(0)
  }

  // Con la pose asentada, el centro de cada tecla lo recibe su botón (nada decorativo encima)
  const covered = []
  for (const [i, t] of TILES.entries()) {
    const box = await showTileSettled(page, i)
    expect(box, `${t.name}: tendría que poder verse entera con la pose asentada`).not.toBeNull()
    const hit = await page.evaluate(
      ({ i, x, y }) => {
        const btn = document.querySelectorAll('#stack [data-stage-block]')[i]
        const top = document.elementFromPoint(x, y)
        return !!top && btn.contains(top) ? null : `<${top?.tagName.toLowerCase()} class="${top?.className}">`
      },
      { i, x: box.x + box.width / 2, y: box.y + box.height / 2 },
    )
    if (hit) covered.push(`${t.name} tapada por ${hit}`)
  }
  expect(covered).toEqual([])
})

test('cada tecla se ve como bloque y su texto se lee sobre el bloque real (píxeles)', async ({ page }) => {
  test.setTimeout(120_000)
  const s = stack(page)
  const live = await isLiveGl(page)
  const sectionBg = parseRgb(await s.section.evaluate((el) => getComputedStyle(el).backgroundColor))
  const tileBg = parseRgb(await cssVarColor(page, '--tile'))

  const report = []
  const bad = []
  for (const [i, t] of TILES.entries()) {
    const btn = s.tile(t)
    const box = await showTileSettled(page, i)
    expect(box, `${t.name}: tendría que poder verse entera con la pose asentada`).not.toBeNull()
    const style = await textStyle(btn)
    if (live) {
      // Con escena viva el botón es transparente: el bloque lo pinta el canvas
      expect(parseRgb(style.bg).a, `${t.name}: con escena viva el botón es transparente`).toBe(0)
    } else {
      // Teja plana (movimiento reducido o sin WebGL)
      expect(colorDistance(parseRgb(style.bg), tileBg), `${t.name}: teja plana con --tile`).toBeLessThan(2)
    }
    // Hay un bloque detrás: el color dominante de la tecla no es el fondo de la sección
    let face = null
    await expect
      .poll(
        async () => {
          face = await dominantColor(page, box)
          return Math.round(colorDistance(face, sectionBg))
        },
        { message: `${t.name}: no se ve un bloque detrás (color dominante = fondo de la sección)` },
      )
      .toBeGreaterThan(20)
    const ratio = Math.round(contrastRatio(parseRgb(style.color), face) * 100) / 100
    report.push(`${t.name}: rgb(${face.r},${face.g},${face.b}) ${Math.round(face.share * 100)} % → ${ratio}:1 (pide ${style.required}, ${style.size}px)`)
    if (ratio < style.required) bad.push(`${t.name}: ${ratio}:1 (pide ${style.required}) sobre rgb(${face.r},${face.g},${face.b})`)
  }
  await test.info().attach('colores-de-las-teclas.txt', { body: report.join('\n'), contentType: 'text/plain' })
  expect(bad, `Texto de las teclas con contraste insuficiente sobre el bloque real:\n${report.join('\n')}`).toEqual([])
})

// Con escena viva, la tecla activa es el bloque 3D teñido con --tile-active y ILUMINADO: la cara
// queda en ≈ rgb(65,128,138) y el texto #eef3f5 baja a ≈ 3,9–4,1:1. Alcanza para texto grande
// (≥24 px, escritorio: 28 px) pero no para el de tablet (23,7 px) ni el de mobile (18 px), que
// piden 4,5:1. La teja plana (--tile-active sin luz, movimiento reducido) da 6,3:1.
const ACTIVE_BUG =
  'BUG stack-active-contrast: con escena viva, el texto de la tecla activa queda en ≈3,9–4,1:1 sobre el bloque iluminado (pide 4,5:1 por debajo de 24 px)'

test('la tecla activa cambia de color y su texto se sigue leyendo (píxeles, bloque elevado)', async ({ page }) => {
  test.setTimeout(90_000)
  test.fail(['tablet', 'mobile'].includes(test.info().project.name), ACTIVE_BUG)
  const s = stack(page)
  const fine = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)
  const report = []
  const bad = []
  for (const name of ['HTML', 'Node.js y Express', 'MongoDB', 'Análisis de sistemas']) {
    const i = TILES.findIndex((t) => t.name === name)
    const btn = s.tile(TILES[i])
    const box = await showTileSettled(page, i)
    expect(box, `${name}: tendría que poder verse entera con la pose asentada`).not.toBeNull()
    if (fine) await pointerAway(page)
    else await page.locator('body').evaluate(() => document.activeElement?.blur())
    await expect.poll(() => activeTiles(page)).toEqual([])
    const idle = await dominantColor(page, box)

    // Activar: hover con puntero fino; foco con puntero grueso
    if (fine) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    else await btn.focus()
    await expect.poll(() => activeTiles(page), { message: `${name} activa` }).toEqual([i])
    const nowBox = await btn.boundingBox()
    let active = null
    await expect
      .poll(
        async () => {
          active = await dominantColor(page, nowBox)
          return Math.round(colorDistance(active, idle))
        },
        { message: `${name}: la tecla activa tendría que cambiar de color (bloque elevado o --tile-active)` },
      )
      .toBeGreaterThan(20)
    const style = await textStyle(btn)
    const ratio = Math.round(contrastRatio(parseRgb(style.color), active) * 100) / 100
    report.push(`${name} activa: rgb(${active.r},${active.g},${active.b}) → ${ratio}:1 (pide ${style.required}, ${style.size}px)`)
    if (ratio < style.required) bad.push(`${name} activa: ${ratio}:1 (pide ${style.required}) sobre rgb(${active.r},${active.g},${active.b})`)
  }
  await test.info().attach('colores-de-la-tecla-activa.txt', { body: report.join('\n'), contentType: 'text/plain' })
  expect(bad, `Texto de la tecla activa con contraste insuficiente:\n${report.join('\n')}`).toEqual([])
})

/* ---------------- Tamaños, overflow y accesibilidad automática ---------------- */

test('teclas de al menos 44 px, dentro del ancho y sin overflow horizontal en toda la sección', async ({ page }) => {
  const s = stack(page)
  await jumpTo(page, '#stack')
  for (const t of TILES) {
    await expectTargetSize(s.tile(t), 44)
    await expectWithinViewportX(s.tile(t))
  }
  await expectWithinViewportX(s.h2)
  // Recorrer la sección con la rueda real, revisando el overflow en cada paso
  const vh = page.viewportSize().height
  for (let i = 0; i < 20; i++) {
    await expectNoHorizontalOverflow(page)
    const rec = await page.evaluate(() => document.getElementById('recorrido').getBoundingClientRect().top)
    if (rec < vh * 0.5) break
    await wheelScroll(page, 300)
  }
  await expectNoHorizontalOverflow(page)
})

test('axe y contraste AA en #stack con la pose asentada, también con una tecla activa', async ({ page }) => {
  test.skip(test.info().project.name === 'tablet', 'axe por sección corre en desktop, mobile y *-reduced')
  const s = stack(page)
  await jumpTo(page, '#stack')
  await nextFrames(page, 10)
  await waitForAnimationsToFinish(page, '#stack')
  await expectNoA11yViolations(page, { include: '#stack' })
  await expectReadableContrast(page, '#stack') // axe no lo mide con el canvas detrás

  // Con una tecla activa (panel con su uso, fondo --tile-active en la teja plana)
  await keyboardFocus(page, s.tile(TILES[3]))
  await expectPanel(s, TILES[3])
  await waitForScrollSettled(page)
  await waitForAnimationsToFinish(page, '#stack')
  await expectNoA11yViolations(page, { include: '#stack' })
  await expectReadableContrast(page, '#stack')
})

/* ---------------- Movimiento reducido ---------------- */

test.describe('movimiento reducido', () => {
  test.beforeEach(() => {
    test.skip(!isReducedProject(), 'Solo en los proyectos *-reduced')
  })

  test('teja plana sin escena viva: fondo --tile, --tile-active al activarse y sin escala al apretar', async ({ page }) => {
    const s = stack(page)
    const html = await page.evaluate(() => ({ motion: document.documentElement.dataset.motion, cls: [...document.documentElement.classList] }))
    expect(html.motion).toBe('reduced')
    expect(html.cls).toContain('reduced')
    expect(html.cls).not.toContain('live')

    // El canvas no acompaña al stack: queda arriba (absoluto) con el IN del inicio
    const canvas = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      return c ? { position: getComputedStyle(c).position, bottom: c.getBoundingClientRect().bottom + scrollY } : null
    })
    const stackTop = await s.section.evaluate((el) => el.getBoundingClientRect().top + scrollY)
    if (canvas) {
      expect(canvas.position).not.toBe('fixed')
      expect(canvas.bottom, 'el canvas no llega al stack').toBeLessThan(stackTop)
    }

    const [tile, tileActive] = [await cssVarColor(page, '--tile'), await cssVarColor(page, '--tile-active')]
    await jumpTo(page, '#stack')
    const btn = s.tile(TILES[0])
    await expect(btn).toHaveCSS('background-color', tile)
    await keyboardFocus(page, btn)
    await expect(btn).toHaveCSS('background-color', tileActive)
    await expectPanel(s, TILES[0])

    // :active sin transform (no hay "apretar" animado)
    const box = await btn.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await expect(btn).toHaveCSS('transform', 'none')
    await page.mouse.up()

    // Sin avisos animados innecesarios: la escena no tiene pose stack, pero el panel funciona igual
    await s.tile(TILES[5]).focus()
    await expectPanel(s, TILES[5])
  })
})
