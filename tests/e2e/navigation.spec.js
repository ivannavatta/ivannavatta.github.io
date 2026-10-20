// Nav (cabecera "circuito"): src/features/navigation.
//
// Escritorio y tablet (≥768): IN + cinco links; se oculta al bajar ≥40 px y aparece al subir ≥24 px
// (siempre visible en los primeros 64 px); oculta, el panel es inerte salvo el IN, y el foco de
// teclado la revela. Mobile (<768): barra fija y menú disclosure con foco atrapado, Esc, página
// inerte y scroll bloqueado. Un link lleva a la sección y deja el foco en su h2.
//
// Corre en los cinco proyectos; cada bloque se saltea en el ancho que no le corresponde.
import {
  test,
  expect,
  waitForAppReady,
  wheelScroll,
  jumpTo,
  scrollY,
  waitForScrollSettled,
  waitForAnimationsToFinish,
  expectNoHorizontalOverflow,
  expectNoA11yViolations,
  expectTargetSize,
  expectVisibleFocus,
  NAV,
  NAV_LINKS,
  SECTIONS,
  MOBILE_MAX,
} from './helpers/index.js'

/** @param {import('@playwright/test').Page} page */
function nav(page) {
  const header = page.getByRole('banner')
  const sections = page.getByRole('navigation', { name: NAV.label })
  // En mobile, con el menú cerrado, todo el <nav> tiene visibility: hidden: para leer atributos
  // (aria-current) hace falta includeHidden también en el contenedor.
  const sectionsAny = page.getByRole('navigation', { name: NAV.label, includeHidden: true })
  return {
    header,
    sections,
    panel: page.locator('#menu'),
    logo: page.getByRole('link', { name: NAV.home }),
    toggle: page.locator('button[aria-controls="menu"]'),
    /** Link de sección. includeHidden: el panel puede estar inerte u oculto y igual queremos leerlo. */
    link: (name) => sectionsAny.getByRole('link', { name, exact: true, includeHidden: true }),
    channels: page.getByRole('list', { name: NAV.channelsLabel }).getByRole('link'),
  }
}

const heading = (page, id) => {
  const s = SECTIONS.find((x) => x.id === id)
  return page.getByRole('heading', { level: s.level, name: s.heading, exact: true })
}

const isMobileViewport = (page) => (page.viewportSize()?.width ?? 1440) <= MOBILE_MAX
const isReducedProject = () => test.info().project.use.reducedMotion === 'reduce'

const navState = (n) => n.header.getAttribute('data-nav-state')
const panelInert = (page) => page.evaluate(() => document.getElementById('menu')?.inert === true)
const pageState = (page) =>
  page.evaluate(() => ({
    mainInert: document.getElementById('main')?.inert === true,
    skipInert: document.querySelector('a[href="#perfil"]:not(header a)')?.inert === true,
    overflow: document.documentElement.style.overflow,
  }))

async function open(page) {
  await page.goto('/')
  await waitForAppReady(page)
}

/* =====================================================================================
   Escritorio y tablet
   ===================================================================================== */
test.describe('nav · escritorio y tablet', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(isMobileViewport(page), 'Solo ≥768 px')
    await open(page)
  })

  test('muestra el IN y las cinco secciones en orden; el botón de menú no existe', async ({ page }) => {
    const n = nav(page)
    await expect(n.header).toBeVisible()
    await expect(n.logo).toBeVisible()
    await expect(n.sections.getByRole('link')).toHaveText(NAV_LINKS.map((l) => l.name))
    for (const { name, href } of NAV_LINKS) await expect(n.link(name)).toHaveAttribute('href', href)
    await expect(n.toggle).toBeHidden()
    await expect(n.channels).toHaveCount(0) // los canales son solo del panel mobile
  })

  test('aria-current="location" sigue al capítulo', async ({ page }) => {
    const n = nav(page)
    await expect(n.logo).toHaveAttribute('aria-current', 'location')
    await expect(n.sections.locator('[aria-current]')).toHaveCount(0)

    for (const { name, id } of NAV_LINKS) {
      await jumpTo(page, `#${id}`)
      await expect(n.link(name), `capítulo ${id}`).toHaveAttribute('aria-current', 'location')
      await expect(n.sections.locator('[aria-current]')).toHaveCount(1)
      await expect(n.logo).not.toHaveAttribute('aria-current', /.*/)
    }

    await jumpTo(page, 0)
    await expect(n.logo).toHaveAttribute('aria-current', 'location')
  })

  test('arriba de todo (≤64 px) no se oculta aunque se baje más de 40 px', async ({ page }) => {
    const n = nav(page)
    const y = await wheelScroll(page, 50)
    expect(y).toBeLessThanOrEqual(64)
    await expect(n.header).toHaveAttribute('data-nav-state', 'visible')
  })

  test('se oculta al bajar 40 px y aparece al subir 24 px (rueda real)', async ({ page }) => {
    const n = nav(page)
    await wheelScroll(page, 600)
    await expect(n.header).toHaveAttribute('data-nav-state', 'hidden')
    expect(await panelInert(page), 'oculta, el panel tiene que ser inerte').toBe(true)

    await wheelScroll(page, -30) // ≥24 hacia arriba
    await expect(n.header).toHaveAttribute('data-nav-state', 'visible')
    expect(await panelInert(page)).toBe(false)

    await wheelScroll(page, 30) // cambio de sentido: 30 < 40, sigue visible
    expect(await navState(n)).toBe('visible')

    await wheelScroll(page, 20) // acumulado 50 ≥ 40
    await expect(n.header).toHaveAttribute('data-nav-state', 'hidden')

    await wheelScroll(page, -16) // 16 < 24, sigue oculta
    expect(await navState(n)).toBe('hidden')

    await wheelScroll(page, -16) // acumulado 32 ≥ 24
    await expect(n.header).toHaveAttribute('data-nav-state', 'visible')
  })

  test('oculta, el IN sigue alcanzable con Tab y al recibir foco revela la nav', async ({ page }) => {
    const n = nav(page)
    await wheelScroll(page, 600)
    await expect(n.header).toHaveAttribute('data-nav-state', 'hidden')

    await page.keyboard.press('Tab') // "Saltar al contenido"
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused()
    await page.keyboard.press('Tab') // el IN
    await expect(n.logo).toBeFocused()
    await expect(n.header).toHaveAttribute('data-nav-state', 'visible')
    expect(await panelInert(page)).toBe(false)
    await expectVisibleFocus(n.logo)

    await page.keyboard.press('Tab')
    await expect(n.link('Perfil')).toBeFocused()

    // Con el foco adentro, bajar no la esconde
    await wheelScroll(page, 600)
    expect(await navState(n)).toBe('visible')

    // Al salir de la cabecera con Tab, vuelve a esconderse al bajar
    for (let i = 0; i < NAV_LINKS.length; i++) await page.keyboard.press('Tab')
    const insideHeader = await n.header.evaluate((h) => h.contains(document.activeElement))
    expect(insideHeader, 'el foco tendría que haber salido de la cabecera').toBe(false)
    await waitForScrollSettled(page)
    await wheelScroll(page, 600)
    await expect(n.header).toHaveAttribute('data-nav-state', 'hidden')
  })

  for (const { name, id } of NAV_LINKS) {
    test(`clic en "${name}": llega a la sección, marca el link y enfoca su h2`, async ({ page }) => {
      const n = nav(page)
      await n.link(name).click()
      const h = heading(page, id)
      await expect(h).toBeFocused()
      await waitForScrollSettled(page)
      await expect(h).toBeInViewport()
      await expect(n.link(name)).toHaveAttribute('aria-current', 'location')
    })
  }

  test('el IN vuelve al inicio y enfoca el h1', async ({ page }) => {
    const n = nav(page)
    await jumpTo(page, '#stack')
    await wheelScroll(page, -60) // subir revela la nav
    await expect(n.header).toHaveAttribute('data-nav-state', 'visible')
    await n.logo.click()
    await expect(heading(page, 'inicio')).toBeFocused()
    await expect.poll(() => scrollY(page)).toBeLessThan(2)
    await expect(n.logo).toHaveAttribute('aria-current', 'location')
  })

  test('foco visible en el IN y en cada link', async ({ page }) => {
    const n = nav(page)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expectVisibleFocus(n.logo)
    for (const { name } of NAV_LINKS) {
      await page.keyboard.press('Tab')
      await expectVisibleFocus(n.link(name))
    }
  })

  test('objetivos de al menos 24 px (WCAG 2.5.8)', async ({ page }) => {
    const n = nav(page)
    await expectTargetSize(n.logo, 24)
    for (const { name } of NAV_LINKS) await expectTargetSize(n.link(name), 24)
  })

  test('axe sin violaciones en la cabecera, sobre sección clara y oscura; sin overflow', async ({ page }) => {
    await expectNoHorizontalOverflow(page)
    await expectNoA11yViolations(page, { include: 'header' })
    // Sobre una sección oscura (proyectos) la cabecera cambia de tema: el contraste también se mide
    await jumpTo(page, '#proyectos')
    await wheelScroll(page, -60)
    await expect(nav(page).header).toHaveAttribute('data-nav-state', 'visible')
    await waitForAnimationsToFinish(page, 'header') // transición de tema claro/oscuro
    await expectNoA11yViolations(page, { include: 'header' })
  })
})

/* =====================================================================================
   Mobile (<768): barra fija y menú
   ===================================================================================== */
test.describe('nav · mobile', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!isMobileViewport(page), 'Solo <768 px')
    await open(page)
  })

  test('barra fija: IN y "Abrir menú" siempre a la vista, links ocultos', async ({ page }) => {
    const n = nav(page)
    await expect(n.toggle).toHaveAccessibleName(NAV.openMenu)
    await expect(n.toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(n.toggle).toHaveAttribute('aria-controls', 'menu')
    await expect(n.link('Perfil')).toBeHidden()

    await wheelScroll(page, 800)
    await expect(n.header).toHaveAttribute('data-nav-state', 'visible')
    await expect(n.logo).toBeInViewport()
    await expect(n.toggle).toBeInViewport()
  })

  test('abrir el menú: aria-expanded, foco en el botón, página inerte y scroll bloqueado', async ({ page }) => {
    const n = nav(page)
    const y0 = await wheelScroll(page, 300)
    await n.toggle.click()

    await expect(n.toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(n.toggle).toHaveAccessibleName(NAV.closeMenu)
    await expect(n.toggle).toBeFocused()
    for (const { name } of NAV_LINKS) await expect(n.link(name)).toBeVisible()
    await expect(n.channels).toHaveCount(4)
    for (const [i, re] of NAV.channels.entries()) await expect(n.channels.nth(i)).toHaveAccessibleName(re)

    expect(await pageState(page)).toEqual({ mainInert: true, skipInert: true, overflow: 'hidden' })

    await wheelScroll(page, 600)
    // Tolerancia de 2 px: redondeo de subpíxel del último cuadro de Lenis
    expect(Math.abs((await scrollY(page)) - y0), 'con el menú abierto la página no se desplaza').toBeLessThanOrEqual(2)
  })

  test('el foco queda atrapado: Tab y Shift+Tab ciclan dentro de la cabecera', async ({ page }) => {
    const n = nav(page)
    await n.toggle.click()
    await expect(n.toggle).toBeFocused()

    const stops = NAV_LINKS.length + 4 + 2 // secciones + canales + IN + botón
    for (let i = 0; i < stops; i++) {
      await page.keyboard.press('Tab')
      expect(await n.header.evaluate((h) => h.contains(document.activeElement)), `Tab #${i + 1} salió de la cabecera`).toBe(true)
    }
    await expect(n.toggle).toBeFocused() // dio la vuelta completa

    await page.keyboard.press('Shift+Tab')
    await expect(n.logo).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(n.channels.last()).toBeFocused()
  })

  test('Escape cierra, devuelve el foco al botón y libera la página', async ({ page }) => {
    const n = nav(page)
    await n.toggle.click()
    await expect(n.toggle).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Escape')

    await expect(n.toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(n.toggle).toHaveAccessibleName(NAV.openMenu)
    await expect(n.toggle).toBeFocused()
    await expect(n.link('Perfil')).toBeHidden()
    expect(await pageState(page)).toEqual({ mainInert: false, skipInert: false, overflow: '' })

    const y0 = await scrollY(page)
    const y1 = await wheelScroll(page, 400)
    expect(y1, 'después de cerrar, la página vuelve a desplazarse').toBeGreaterThan(y0 + 100)
  })

  for (const { name, id } of NAV_LINKS) {
    test(`link "${name}" del menú: cierra, enfoca el h2 y desplaza`, async ({ page }) => {
      const n = nav(page)
      await n.toggle.click()
      await n.link(name).click()

      await expect(n.toggle).toHaveAttribute('aria-expanded', 'false')
      const h = heading(page, id)
      await expect(h).toBeFocused()
      expect(await pageState(page)).toEqual({ mainInert: false, skipInert: false, overflow: '' })
      await waitForScrollSettled(page)
      await expect(h).toBeInViewport()
      await expect(n.link(name)).toHaveAttribute('aria-current', 'location')
    })
  }

  test('pasar a escritorio con el menú abierto lo cierra sin dejar la página inerte', async ({ page }) => {
    const n = nav(page)
    await n.toggle.click()
    await expect(n.toggle).toHaveAttribute('aria-expanded', 'true')

    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(n.toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(n.toggle).toBeHidden()
    expect(await pageState(page)).toEqual({ mainInert: false, skipInert: false, overflow: '' })
    for (const { name } of NAV_LINKS) await expect(n.link(name)).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('objetivos táctiles de 44 px: IN, botón y links del panel', async ({ page }) => {
    const n = nav(page)
    await expectTargetSize(n.logo, 44)
    await expectTargetSize(n.toggle, 44)
    await n.toggle.click()
    for (const { name } of NAV_LINKS) await expectTargetSize(n.link(name), 44)
    for (let i = 0; i < 4; i++) await expectTargetSize(n.channels.nth(i), 44)
  })

  test('foco visible en el botón y en los links del panel', async ({ page }) => {
    const n = nav(page)
    await n.toggle.focus()
    await page.keyboard.press('Enter')
    await expect(n.toggle).toHaveAttribute('aria-expanded', 'true')
    await expectVisibleFocus(n.toggle)
    for (const { name } of NAV_LINKS) {
      await page.keyboard.press('Tab')
      await expectVisibleFocus(n.link(name))
    }
  })

  test('axe sin violaciones con el menú cerrado y abierto; sin overflow', async ({ page }) => {
    const n = nav(page)
    await expectNoHorizontalOverflow(page)
    await expectNoA11yViolations(page, { include: 'header' })
    await n.toggle.click()
    await expect(n.link('Contacto')).toBeVisible()
    await waitForScrollSettled(page)
    await waitForAnimationsToFinish(page, 'header') // entrada escalonada de los links (opacidad)
    await expectNoHorizontalOverflow(page)
    await expectNoA11yViolations(page, { include: 'header' })
  })
})

/* =====================================================================================
   Movimiento reducido (proyectos *-reduced, con reducedMotion: 'reduce')
   ===================================================================================== */
test.describe('nav · movimiento reducido', () => {
  test.beforeEach(() => {
    test.skip(!isReducedProject(), 'Solo en los proyectos *-reduced')
  })

  test('sin Lenis: data-motion="reduced" y los links saltan sin animación', async ({ page }) => {
    await open(page)
    const state = await page.evaluate(() => ({
      motion: document.documentElement.dataset.motion,
      lenis: document.documentElement.classList.contains('lenis'),
      live: document.documentElement.classList.contains('live'),
    }))
    expect(state).toEqual({ motion: 'reduced', lenis: false, live: false })

    const n = nav(page)
    if (isMobileViewport(page)) await n.toggle.click()
    await n.link('Recorrido').click()
    const h = heading(page, 'recorrido')
    await expect(h).toBeFocused()
    // Salto instantáneo: en el frame siguiente ya está en pantalla, sin esperar un scroll suave
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    await expect(h).toBeInViewport({ timeout: 500 })
  })
})
