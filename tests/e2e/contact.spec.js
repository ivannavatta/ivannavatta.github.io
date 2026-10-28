// Contacto (#contacto): src/features/contact.
//
// h2 "Contacto", pedido y texto; canales como pines (lista "Canales": Email con "Copiar email",
// LinkedIn, GitHub y CV); formulario "O dejame un mensaje" (Nombre, Email, Mensaje, honeypot) y
// el pie con "Volver al inicio". En mobile el formulario se abre con "Escribir un mensaje".
//
// Dos builds (ver helpers/servers.js y playwright.config.js):
//   - el normal (BASE_URL), SIN claves de EmailJS: el formulario avisa desde el principio y ofrece
//     un mailto con asunto y cuerpo; nunca llama a api.emailjs.com;
//   - el de envío (MAIL_URL), con claves DE MENTIRA: api.emailjs.com siempre mockeado con
//     stubEmailJs. Además el fixture noRealEmail aborta (y hace fallar) cualquier llamada sin mock.
// EmailJS corta los navegadores automatizados (blockHeadless: navigator.webdriver → 451): los tests
// de envío ponen navigator.webdriver = false con un init script. Su limitRate guarda la hora en
// localStorage ANTES de enviar: cada test arranca con un contexto nuevo (localStorage vacío).
import AxeBuilder from '@axe-core/playwright'
import {
  test,
  expect,
  waitForAppReady,
  waitForAnimationsToFinish,
  waitForScrollSettled,
  jumpTo,
  expectNoHorizontalOverflow,
  expectTargetSize,
  expectNoA11yViolations,
  expectReadableContrast,
  expectVisibleFocus,
  keyboardFocus,
  stubEmailJs,
  EMAIL,
} from './helpers/index.js'
import { MAIL_URL } from './helpers/servers.js'

const TITLE = 'Contacto'
const LEAD = 'Busco una pasantía o mi primer puesto como desarrollador.'
const TEXT = 'Si tu equipo construye software para resolver problemas de negocio, quiero conocerlo. También me sumo a proyectos puntuales.'
const FORM_TITLE = 'O dejame un mensaje'
const NEW_TAB = '(se abre en otra pestaña)'
const PINS = [
  { name: `Email ${EMAIL}`, href: `mailto:${EMAIL}` },
  { name: `LinkedIn Ivan Navatta ${NEW_TAB}`, href: 'https://www.linkedin.com/in/ivan-navatta-ab5702221/', external: true },
  { name: `GitHub ivannavatta ${NEW_TAB}`, href: 'https://github.com/ivannavatta', external: true },
  { name: 'CV Descargar PDF', href: '/cv.pdf', download: true },
]
const ERRORS = {
  name: 'Escribí tu nombre.',
  emailEmpty: 'Escribí tu email para que pueda responderte.',
  emailInvalid: 'Revisá el email: tiene que tener @ y un dominio, como nombre@empresa.com.',
  message: 'Contame en qué te puedo ayudar (al menos 10 caracteres).',
}
const MAX_LENGTH = { Nombre: 80, Email: 254, Mensaje: 2000 }
const VALID = { name: 'Ana Gómez', email: 'ana@empresa.com', message: 'Hola Ivan, quería consultarte por una pasantía.' }
const MSG = {
  success: `Mensaje enviado. Gracias, Ana: te respondo a ${VALID.email}.`,
  error: `No se pudo enviar el mensaje. Lo que escribiste sigue acá: probá de nuevo en un rato o escribime a ${EMAIL}.`,
  tooSoon: `Acabás de mandar un mensaje. Esperá unos segundos para mandar otro, o escribime a ${EMAIL}.`,
  notConfiguredNote: `El envío desde acá todavía no está activo. Escribime a ${EMAIL}.`,
  notConfigured: 'El envío desde acá todavía no está activo. Abrir el mensaje en tu correo.',
}

const isReducedProject = () => test.info().project.use.reducedMotion === 'reduce'
const projectName = () => test.info().project.name

/** @param {import('@playwright/test').Page} page */
const contact = (page) => {
  const section = page.locator('#contacto')
  const form = section.getByRole('form', { name: FORM_TITLE })
  return {
    section,
    h2: section.getByRole('heading', { level: 2, name: TITLE, exact: true }),
    pins: section.getByRole('list', { name: 'Canales' }),
    copyButton: section.getByRole('button', { name: /^(Copiar email|Copiado|No se pudo copiar)$/ }),
    copyStatus: section.locator('ul[aria-label="Canales"] ~ [role="status"]'),
    write: section.getByRole('button', { name: /^(Escribir un mensaje|Ocultar el formulario)$/ }),
    form,
    // exact: "Mensaje" también matchea el nombre del form ("O dejame un mensaje")
    name: form.getByLabel('Nombre', { exact: true }),
    email: form.getByLabel('Email', { exact: true }),
    message: form.getByLabel('Mensaje', { exact: true }),
    honeypot: section.locator('input[name="website"]'),
    submit: form.getByRole('button', { name: /^(Enviar mensaje|Enviando…)$/ }),
    // Vacío mide 0 px de alto: con CSS, no con getByRole (que lo descarta)
    status: form.locator('[role="status"]'),
    backToTop: section.getByRole('link', { name: 'Volver al inicio', exact: true }),
  }
}

/** En mobile el formulario se abre a pedido; en el resto ya está visible. */
async function openForm(page) {
  const c = contact(page)
  if (await c.write.count()) {
    if ((await c.write.getAttribute('aria-expanded')) !== 'true') await c.write.click()
  }
  await expect(c.form).toBeVisible()
  return c
}

async function fillValid(c, values = VALID) {
  await c.name.fill(values.name)
  await c.email.fill(values.email)
  await c.message.fill(values.message)
}

/** Requests a api.emailjs.com que salieron de la página (las mockeadas incluidas). */
function trackEmailJs(page) {
  const urls = []
  page.on('request', (r) => {
    if (r.url().startsWith('https://api.emailjs.com/')) urls.push(r.url())
  })
  return urls
}

/** Build de envío: claves de mentira, EmailJS siempre mockeado y navigator.webdriver = false. */
async function gotoMailBuild(page, stub = {}) {
  await page.addInitScript(() => {
    // blockHeadless de EmailJS rechaza (451) si navigator.webdriver es true, como en Playwright
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true })
  })
  const calls = await stubEmailJs(page, stub)
  await page.goto(`${MAIL_URL}/`)
  await waitForAppReady(page)
  await jumpTo(page, '#contacto')
  const c = await openForm(page)
  return { c, calls }
}

/* ---------------- Estructura y canales (todos los proyectos) ---------------- */

test.describe('estructura', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('h2, pedido, canales en orden, formulario con sus labels y el pie', async ({ page }) => {
    const c = contact(page)
    await expect(c.section).toHaveAttribute('aria-labelledby', 'contact-title')
    await expect(c.section.getByRole('heading', { level: 2 })).toHaveCount(1)
    await expect(c.h2).toHaveId('contact-title')
    await expect(c.section.getByText(LEAD, { exact: true })).toBeVisible()
    await expect(c.section.getByText(TEXT, { exact: true })).toBeVisible()

    // Pines: nombre accesible = texto visible (+ aviso de pestaña nueva), sin aria-label
    const links = c.pins.getByRole('listitem').getByRole('link')
    await expect(c.pins.getByRole('listitem')).toHaveCount(PINS.length)
    await expect(links).toHaveCount(PINS.length)
    for (const [i, pin] of PINS.entries()) {
      const link = links.nth(i)
      await expect(link).toHaveAccessibleName(pin.name)
      await expect(link).toHaveAttribute('href', pin.href)
      await expect(link).not.toHaveAttribute('aria-label')
      if (pin.external) {
        await expect(link).toHaveAttribute('target', '_blank')
        await expect(link).toHaveAttribute('rel', /noopener/)
        await expect(link).toHaveAttribute('rel', /noreferrer/)
      } else await expect(link).not.toHaveAttribute('target')
      if (pin.download) await expect(link).toHaveAttribute('download')
    }
    await expect(c.copyButton).toHaveText('Copiar email')
    await expect(c.copyButton).toHaveAttribute('type', 'button')

    // Formulario (en mobile, abierto a pedido) con sus tres campos y el honeypot fuera del árbol
    await jumpTo(page, '#contacto')
    await openForm(page)
    await expect(c.form.getByRole('heading', { level: 3 })).toHaveText(FORM_TITLE)
    await expect(c.name).toHaveAttribute('autocomplete', 'name')
    await expect(c.email).toHaveAttribute('type', 'email')
    await expect(c.email).toHaveAttribute('autocomplete', 'email')
    await expect(c.message).toHaveJSProperty('tagName', 'TEXTAREA')
    for (const field of [c.name, c.email, c.message]) {
      await expect(field).toHaveAttribute('required')
      await expect(field).toHaveAttribute('aria-invalid', 'false')
    }
    await expect(c.form).toHaveAttribute('novalidate')
    await expect(c.submit).toHaveText('Enviar mensaje')
    await expect(c.submit).toHaveAttribute('type', 'submit')
    await expect(c.form.getByRole('textbox')).toHaveCount(3)

    // Pie
    await expect(c.section.locator('footer')).toContainText(`Ivan Navatta · Buenos Aires · ${new Date().getFullYear()}`)
    await expect(c.backToTop).toHaveAttribute('href', '#inicio')
    // El IN de contacto es decorativo
    const decor = await c.section.evaluate((s) => [...s.querySelectorAll('[data-stage-pose]')].map((el) => !!el.closest('[aria-hidden="true"]')))
    expect(decor.length).toBeGreaterThan(0)
    expect(decor.every(Boolean)).toBe(true)
  })

  test('el honeypot no se ve, no recibe foco con Tab y está fuera del árbol de accesibilidad', async ({ page }) => {
    const c = contact(page)
    await jumpTo(page, '#contacto')
    await openForm(page)
    await expect(c.honeypot).toHaveAttribute('tabindex', '-1')
    await expect(c.honeypot).toHaveAttribute('autocomplete', 'off')
    const info = await c.honeypot.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { hidden: !!el.closest('[aria-hidden="true"]'), right: r.right, vw: innerWidth }
    })
    expect(info.hidden, 'honeypot dentro de aria-hidden').toBe(true)
    expect(info.right, 'honeypot fuera de pantalla').toBeLessThanOrEqual(0)
    // Recorrer el formulario con Tab: Nombre → Email → Mensaje → Enviar, sin pasar por el honeypot
    await keyboardFocus(page, c.name)
    const seen = []
    for (let i = 0; i < 5; i++) {
      seen.push(await page.evaluate(() => document.activeElement.name || document.activeElement.textContent.trim()))
      await page.keyboard.press('Tab')
    }
    expect(seen.slice(0, 4)).toEqual(['name', 'email', 'message', 'Enviar mensaje'])
    expect(seen).not.toContain('website')
  })

  test('maxLength 80, 254 y 2000: no se puede escribir más', async ({ page }) => {
    const c = contact(page)
    await jumpTo(page, '#contacto')
    await openForm(page)
    for (const [label, max] of Object.entries(MAX_LENGTH)) {
      const field = c.form.getByLabel(label, { exact: true })
      await expect(field).toHaveAttribute('maxlength', String(max))
      await field.click()
      // insertText respeta maxlength como el tipeo real (fill lo pasaría por alto en algunos casos)
      await page.keyboard.insertText('a'.repeat(max + 25))
      await expect.poll(() => field.evaluate((el) => el.value.length), { message: label }).toBe(max)
    }
  })
})

/* ---------------- Validación (build normal, sin envío) ---------------- */

test.describe('validación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    await jumpTo(page, '#contacto')
    await openForm(page)
  })

  test('envío vacío: tres errores asociados, aria-invalid y foco en Nombre; sin llamar a EmailJS', async ({ page }) => {
    const calls = trackEmailJs(page)
    const c = contact(page)
    await c.submit.click()
    await expect(c.name).toBeFocused()
    for (const [field, text] of [
      [c.name, ERRORS.name],
      [c.email, ERRORS.emailEmpty],
      [c.message, ERRORS.message],
    ]) {
      await expect(field).toHaveAttribute('aria-invalid', 'true')
      await expect(field).toHaveAccessibleDescription(text)
      const id = await field.getAttribute('aria-describedby')
      await expect(page.locator(`#${id}`)).toHaveText(text)
      await expect(page.locator(`#${id}`)).toBeVisible()
    }
    await expect(c.status).toHaveText('')
    expect(calls).toEqual([])
  })

  test('email inválido: mensaje específico y foco en Email', async ({ page }) => {
    const c = contact(page)
    await fillValid(c, { ...VALID, email: 'ana@empresa' })
    await c.submit.click()
    await expect(c.email).toBeFocused()
    await expect(c.email).toHaveAccessibleDescription(ERRORS.emailInvalid)
    await expect(c.name).toHaveAttribute('aria-invalid', 'false')
    await expect(c.message).toHaveAttribute('aria-invalid', 'false')
  })

  test('antes del primer intento no hay errores; después se actualizan mientras se escribe', async ({ page }) => {
    const c = contact(page)
    await c.name.fill('A')
    await c.email.fill('x')
    await expect(c.name).toHaveAttribute('aria-invalid', 'false')
    await expect(c.email).toHaveAccessibleDescription('')

    await c.submit.click()
    await expect(c.name).toHaveAccessibleDescription(ERRORS.name)
    await expect(c.email).toHaveAccessibleDescription(ERRORS.emailInvalid)
    await c.name.fill('Ana')
    await expect(c.name).toHaveAttribute('aria-invalid', 'false')
    await expect(c.name).toHaveAccessibleDescription('')
    await c.email.fill('')
    await expect(c.email).toHaveAccessibleDescription(ERRORS.emailEmpty)
    await c.email.fill(VALID.email)
    await expect(c.email).toHaveAttribute('aria-invalid', 'false')
    await c.message.fill('Hola')
    await expect(c.message).toHaveAccessibleDescription(ERRORS.message)
    await c.message.fill(VALID.message)
    await expect(c.message).toHaveAttribute('aria-invalid', 'false')
  })
})

/* ---------------- Sin claves (build normal): aviso, mailto y cero llamadas ---------------- */

test('sin claves: aviso desde el principio, mailto con asunto y cuerpo, sin SDK ni llamadas a EmailJS', async ({ page }) => {
  const calls = trackEmailJs(page)
  const scripts = []
  page.on('response', async (r) => {
    if (r.request().resourceType() === 'script') scripts.push(r.url())
  })
  await page.goto('/')
  await waitForAppReady(page)
  await jumpTo(page, '#contacto')
  const c = await openForm(page)
  await expect(c.form.getByText(/^El envío desde acá todavía no está activo\. Escribime a/)).toHaveText(MSG.notConfiguredNote)
  await expect(c.form.getByRole('link', { name: EMAIL, exact: true })).toHaveAttribute('href', `mailto:${EMAIL}`)

  const before = scripts.length
  await fillValid(c)
  await c.submit.click()
  await expect(c.status).toHaveText(MSG.notConfigured)
  const open = c.status.getByRole('link', { name: 'Abrir el mensaje en tu correo' })
  const href = await open.getAttribute('href')
  const url = new URL(href)
  expect(url.protocol).toBe('mailto:')
  expect(url.pathname).toBe(EMAIL)
  expect(url.searchParams.get('subject')).toBe(`Contacto desde el portfolio: ${VALID.name}`)
  expect(url.searchParams.get('body')).toBe(VALID.message)
  // Lo escrito se conserva (el mailto lo lleva al correo)
  await expect(c.name).toHaveValue(VALID.name)
  expect(calls, 'sin claves no se llama a EmailJS').toEqual([])
  expect(scripts.slice(before), 'sin claves no se carga el SDK').toEqual([])
})

/* ---------------- Envío con EmailJS mockeado (build con claves de mentira) ---------------- */

test.describe('envío (claves de mentira, EmailJS mockeado)', () => {
  test.beforeEach(() => {
    test.skip(!['desktop', 'mobile'].includes(projectName()), 'Envío: desktop y mobile')
  })

  test('éxito: "Enviando…" con aria-disabled (no disabled), un solo envío con doble clic, payload y formulario limpio', async ({ page }) => {
    const sdk = []
    page.on('response', async (r) => {
      if (r.request().resourceType() === 'script' && (await r.text().catch(() => '')).includes('api.emailjs.com')) sdk.push(r.url())
    })
    const { c, calls } = await gotoMailBuild(page, { status: 200, delayMs: 1500 })
    // Con claves no hay aviso
    await expect(c.form.getByText(/todavía no está activo/)).toHaveCount(0)
    expect(sdk, 'el SDK no se carga con la página').toEqual([])

    await fillValid(c)
    await c.submit.dblclick()
    await expect(c.submit).toHaveText('Enviando…')
    await expect(c.submit).toHaveAttribute('aria-disabled', 'true')
    await expect(c.submit).toHaveAttribute('aria-busy', 'true')
    await expect(c.submit).not.toHaveAttribute('disabled')
    await expect(c.submit).toBeFocused() // sigue enfocable mientras envía
    // Un tercer intento (Enter) mientras envía tampoco manda otro
    await c.submit.press('Enter')

    await expect(c.status).toHaveText(MSG.success)
    await expect(c.submit).toHaveText('Enviar mensaje')
    await expect(c.submit).not.toHaveAttribute('aria-disabled')
    await expect(c.submit).not.toHaveAttribute('aria-busy')
    for (const field of [c.name, c.email, c.message]) await expect(field).toHaveValue('')

    expect(calls, 'un solo envío').toHaveLength(1)
    expect(calls[0].method).toBe('POST')
    expect(calls[0].url).toBe('https://api.emailjs.com/api/v1.0/email/send')
    const body = JSON.parse(calls[0].postData)
    expect(body).toMatchObject({ service_id: 'service_prueba', template_id: 'template_prueba', user_id: 'clave_prueba' })
    expect(body.template_params).toEqual({
      from_name: VALID.name,
      from_email: VALID.email,
      reply_to: VALID.email,
      message: VALID.message,
    })
    // El SDK se cargó recién al enviar, desde el propio sitio (la CSP lo permite: el fixture cspViolations
    // falla el test ante cualquier violación, también la de connect-src a api.emailjs.com)
    expect(sdk).toHaveLength(1)
    expect(new URL(sdk[0]).origin).toBe(MAIL_URL)
  })

  test('los datos se recortan antes de enviar', async ({ page }) => {
    const { c, calls } = await gotoMailBuild(page, { status: 200 })
    await fillValid(c, { name: `  ${VALID.name}  `, email: ` ${VALID.email} `, message: `\n${VALID.message}  ` })
    await c.submit.click()
    await expect(c.status).toHaveText(MSG.success)
    expect(JSON.parse(calls[0].postData).template_params).toEqual({
      from_name: VALID.name,
      from_email: VALID.email,
      reply_to: VALID.email,
      message: VALID.message,
    })
  })

  test.describe('con el servicio caído', () => {
    // El 500 mockeado lo reporta Chromium como console.error ("Failed to load resource"); los 4xx/5xx
    // del propio sitio los sigue vigilando pageErrors por la respuesta, no por este texto.
    test.use({ allowedErrors: [/^Failed to load resource: the server responded with a status of 500/] })

    test('error 500: mensaje visible y anunciado, conserva lo escrito; reintentar enseguida avisa "esperá unos segundos"', async ({ page }) => {
      const { c, calls } = await gotoMailBuild(page, { status: 500, body: 'Error' })
      await fillValid(c)
      await c.submit.click()
      await expect(c.status).toHaveText(MSG.error)
      await expect(c.status.getByRole('link', { name: EMAIL })).toHaveAttribute('href', `mailto:${EMAIL}`)
      await expect(c.name).toHaveValue(VALID.name)
      await expect(c.email).toHaveValue(VALID.email)
      await expect(c.message).toHaveValue(VALID.message)
      await expect(c.submit).toHaveText('Enviar mensaje')
      expect(calls).toHaveLength(1)

      // limitRate guarda la hora ANTES de enviar: el reintento inmediato no llega a la red
      const stamp = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes('portfolio-contacto')))
      expect(stamp.length, 'limitRate guarda la marca en localStorage').toBeGreaterThan(0)
      await c.submit.click()
      await expect(c.status).toHaveText(MSG.tooSoon)
      await expect(c.name).toHaveValue(VALID.name)
      expect(calls, 'el reintento inmediato no llama a EmailJS').toHaveLength(1)
    })
  })

  test('honeypot completo: finge el éxito y no envía nada', async ({ page }) => {
    const { c, calls } = await gotoMailBuild(page, { status: 200 })
    await fillValid(c)
    await c.honeypot.fill('https://spam.example', { force: true })
    await c.submit.click()
    await expect(c.status).toHaveText(MSG.success)
    expect(calls).toEqual([])
  })
})

/* ---------------- Copiar email ---------------- */

test.describe('copiar email', () => {
  test.beforeEach(() => {
    test.skip(!['desktop', 'mobile'].includes(projectName()), 'Copiar: desktop y mobile')
  })

  test('copia al portapapeles, dice "Copiado", lo anuncia y vuelve al texto original', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
    await waitForAppReady(page)
    await jumpTo(page, '#contacto')
    const c = contact(page)
    await expect(c.copyStatus).toHaveText('')
    await c.copyButton.click()
    await expect(c.copyButton).toHaveText('Copiado')
    await expect(c.copyStatus).toHaveText('Email copiado al portapapeles.')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL)
    // A los 2,2 s vuelve y el aviso se vacía (el próximo intento se anuncia de nuevo)
    await expect(c.copyButton).toHaveText('Copiar email', { timeout: 5_000 })
    await expect(c.copyStatus).toHaveText('')
  })

  test('si no se puede copiar, lo dice y anuncia el email', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'clipboard', {
        get: () => ({ writeText: () => Promise.reject(new Error('sin permiso')) }),
        configurable: true,
      })
      document.execCommand = () => false
    })
    await page.goto('/')
    await waitForAppReady(page)
    await jumpTo(page, '#contacto')
    const c = contact(page)
    await c.copyButton.click()
    await expect(c.copyButton).toHaveText('No se pudo copiar')
    await expect(c.copyStatus).toHaveText(`No se pudo copiar. El email es ${EMAIL}.`)
  })
})

/* ---------------- Mobile: "Escribir un mensaje" ---------------- */

test.describe('mobile: formulario a pedido', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!['mobile', 'mobile-reduced'].includes(projectName()), 'Solo por debajo de 768 px')
    await page.goto('/')
    await waitForAppReady(page)
    await jumpTo(page, '#contacto')
  })

  test('"Escribir un mensaje" ↔ "Ocultar el formulario": aria-expanded, foco en Nombre y scroll hasta el formulario', async ({ page }) => {
    const c = contact(page)
    await expect(c.write).toHaveText('Escribir un mensaje')
    await expect(c.write).toHaveAttribute('aria-expanded', 'false')
    await expect(c.write).toHaveAttribute('aria-controls', 'contact-form')
    await expect(c.form).toBeHidden()
    await expectTargetSize(c.write, 44)

    await c.write.click()
    await expect(c.write).toHaveAttribute('aria-expanded', 'true')
    await expect(c.write).toHaveAccessibleName('Ocultar el formulario')
    await expect(c.form).toBeVisible()
    await expect(c.name).toBeFocused()
    await waitForScrollSettled(page)
    // El scroll acompaña: el título del formulario y Nombre quedan en pantalla, debajo de la barra
    const pos = await page.evaluate(() => {
      const header = document.querySelector('header').getBoundingClientRect().bottom
      const title = document.getElementById('contact-form-title').getBoundingClientRect()
      const name = document.getElementById('contact-form-name').getBoundingClientRect()
      return { header, titleTop: title.top, nameBottom: name.bottom, vh: innerHeight }
    })
    expect(pos.titleTop, 'el título del formulario queda debajo de la barra').toBeGreaterThanOrEqual(pos.header)
    expect(pos.nameBottom, 'Nombre en pantalla').toBeLessThanOrEqual(pos.vh)
    await expectNoHorizontalOverflow(page)

    await c.write.click()
    await expect(c.write).toHaveAttribute('aria-expanded', 'false')
    await expect(c.write).toHaveAccessibleName('Escribir un mensaje')
    await expect(c.form).toBeHidden()
    await expect(c.write).toBeFocused()
  })
})

test('por encima de 767 px no hay botón "Escribir un mensaje": el formulario está siempre visible', async ({ page }) => {
  test.skip(['mobile', 'mobile-reduced'].includes(projectName()), 'Solo ≥768')
  await page.goto('/')
  await waitForAppReady(page)
  const c = contact(page)
  await expect(c.write).toHaveCount(0)
  await expect(c.form).toBeVisible()
})

/* ---------------- Una pantalla ---------------- */

for (const size of [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 375, height: 812 },
]) {
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: size })
    test.beforeEach(() => {
      test.skip(projectName() !== 'desktop', 'Tamaño fijo: corre en el proyecto desktop')
    })

    test('la sección entra en una pantalla (con el formulario cerrado en mobile)', async ({ page }) => {
      await page.goto('/')
      await waitForAppReady(page)
      await jumpTo(page, '#contacto')
      const c = contact(page)
      if (size.width < 768) await expect(c.form).toBeHidden()
      const r = await c.section.evaluate((s) => {
        const box = s.getBoundingClientRect()
        const last = Math.max(...[...s.querySelectorAll('*')].map((el) => el.getBoundingClientRect().bottom))
        return { height: box.height, top: box.top, contentBottom: last - box.top, vh: innerHeight }
      })
      expect(r.height, `alto de #contacto en ${size.width}×${size.height}`).toBeLessThanOrEqual(r.vh + 1)
      expect(r.contentBottom, 'el contenido no se sale de la sección').toBeLessThanOrEqual(r.height + 1)
      await expectNoHorizontalOverflow(page)
    })
  })
}

test('en su propio tamaño, la sección entra en una pantalla', async ({ page }) => {
  test.skip(projectName() === 'desktop', 'desktop lo cubre la tabla de tamaños')
  await page.goto('/')
  await waitForAppReady(page)
  await jumpTo(page, '#contacto')
  const r = await contact(page).section.evaluate((s) => ({ height: s.getBoundingClientRect().height, vh: innerHeight }))
  expect(r.height).toBeLessThanOrEqual(r.vh + 1)
})

/* ---------------- Volver al inicio ---------------- */

test('"Volver al inicio" lleva a scrollY 0 y enfoca el h1', async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)
  await jumpTo(page, '#contacto')
  const c = contact(page)
  await keyboardFocus(page, c.backToTop)
  await expectVisibleFocus(c.backToTop)
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 10_000 }).toBe(0)
  await expect(page.getByRole('heading', { level: 1, name: 'Ivan Navatta' })).toBeFocused()
})

/* ---------------- axe, contraste, nombre accesible de los pines, overflow ---------------- */

/** Corre solo label-content-name-mismatch (regla experimental: axe no la corre por defecto). */
async function expectLabelInName(page, include) {
  const results = await new AxeBuilder({ page }).include(include).withRules(['label-content-name-mismatch']).analyze()
  // Es experimental: hay que pedirla. Solo aplica a controles con aria-label Y texto visible; sin
  // aria-label (los pines) o sin texto (el IN, un SVG) queda "inapplicable", que también es válido.
  const ran = [...results.passes, ...results.violations, ...results.incomplete, ...results.inapplicable].some(
    (r) => r.id === 'label-content-name-mismatch',
  )
  expect(ran, `label-content-name-mismatch no corrió en ${include}`).toBe(true)
  expect(results.violations.flatMap((v) => v.nodes.map((n) => n.target.join(' '))), `label-content-name-mismatch en ${include}`).toEqual([])
}

test('axe y contraste AA en #contacto: limpio, con errores y (mobile) con el formulario abierto', async ({ page }) => {
  test.skip(projectName() === 'tablet', 'axe por sección corre en desktop, mobile y *-reduced')
  await page.goto('/')
  await waitForAppReady(page)
  await jumpTo(page, '#contacto')
  await waitForAnimationsToFinish(page, '#contacto')
  await expectNoA11yViolations(page, { include: '#contacto' })
  await expectReadableContrast(page, '#contacto')
  await expectLabelInName(page, '#contacto')

  const c = await openForm(page)
  await c.submit.click()
  await expect(c.name).toHaveAttribute('aria-invalid', 'true')
  await c.name.scrollIntoViewIfNeeded()
  await waitForScrollSettled(page)
  await waitForAnimationsToFinish(page, '#contacto')
  await expectNoA11yViolations(page, { include: '#contacto' })
  await expectReadableContrast(page, '#contacto')
})

test('label-content-name-mismatch: los pines de la cabecera (menú mobile abierto) tampoco', async ({ page }) => {
  test.skip(!['mobile', 'desktop'].includes(projectName()), 'desktop y mobile')
  await page.goto('/')
  await waitForAppReady(page)
  const menu = page.getByRole('button', { name: 'Abrir menú' })
  if (await menu.count()) {
    await menu.click()
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toBeVisible()
    await waitForAnimationsToFinish(page, 'header')
  }
  await expectLabelInName(page, 'header')
})

test('sin overflow horizontal en #contacto (con el formulario abierto y con errores)', async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)
  await jumpTo(page, '#contacto')
  await expectNoHorizontalOverflow(page)
  const c = await openForm(page)
  await c.submit.click()
  await expect(c.email).toHaveAttribute('aria-invalid', 'true')
  await expectNoHorizontalOverflow(page)
})

test.describe('movimiento reducido', () => {
  test.beforeEach(() => {
    test.skip(!isReducedProject(), 'Solo en los proyectos *-reduced')
  })

  test('el formulario funciona igual: validación, foco y "Volver al inicio" sin animación', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)
    expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe('reduced')
    await jumpTo(page, '#contacto')
    const c = await openForm(page)
    await c.submit.click()
    await expect(c.name).toBeFocused()
    await c.backToTop.click()
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  })
})
