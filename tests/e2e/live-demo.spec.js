// "Probar en vivo" en los casos uadeHUB y box9 (src/features/projects/components/live).
//
// La terminal corre el main.py real de cada proyecto con Pyodide (Python en WebAssembly) en un Web
// Worker propio (live/programs.js). Pyodide se sirve desde el propio sitio (public/pyodide/, lo
// copia scripts/copy-pyodide.mjs) y se descarga recién al tocar el botón. Corre bajo la CSP real
// del build (script-src 'self'): el fixture cspViolations falla el test ante cualquier violación.
//
// uadeHUB, datos semilla: Martina Lopez (1100001) y Tomas Gomez (1100002); Martina tiene reservado
// hoy el lugar 1 de "privados" en el Piso 10-Uade Comunitario. box9 arranca sin empleados.
import {
  test,
  expect,
  waitForAppReady,
  waitForAnimationsToFinish,
  jumpTo,
  keyboardFocus,
  expectNoHorizontalOverflow,
  expectNoA11yViolations,
  expectReadableContrast,
  findCoveredContent,
} from './helpers/index.js'

const BOOT_TIMEOUT = 90_000 // primera carga de Pyodide (~13 MB sin comprimir) con 3 workers en paralelo
const STEP_TIMEOUT = 15_000

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} [name] nombre del caso (uadeHUB por defecto)
 */
const demo = (page, name = 'uadeHUB') => {
  const article = page.locator('#proyectos').getByRole('article', { name, exact: true })
  const region = page.getByRole('region', { name: `${name} en vivo` })
  return {
    article,
    region,
    open: article.getByRole('button', { name: 'Probar en vivo' }),
    arch: article.getByRole('button', { name: /^Ver (arquitectura|resumen)$/ }),
    log: region.getByRole('log', { name: 'Salida del programa' }),
    input: region.getByRole('textbox', { name: 'Tu respuesta' }),
    restart: region.getByRole('button', { name: 'Reiniciar' }),
    close: region.getByRole('button', { name: 'Cerrar' }),
    figure: article.getByRole('figure'),
  }
}

/** Abre la demo con el teclado (si el caso todavía no entró en el apilado, el foco lo trae). */
async function openDemo(page, name) {
  const d = demo(page, name)
  await keyboardFocus(page, d.open)
  await page.keyboard.press('Enter')
  await expect(d.open).toHaveAttribute('aria-expanded', 'true')
  await expect(d.region).toBeVisible()
  return d
}

/** Escribe una línea, Enter, y espera el texto que la sigue. */
async function answer(d, line, next) {
  await d.input.fill(line)
  await d.input.press('Enter')
  await expect(d.log).toContainText(next, { timeout: STEP_TIMEOUT })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)
})

test('Pyodide no se descarga hasta tocar "Probar en vivo"; después, solo desde el propio sitio', async ({ page }) => {
  test.setTimeout(150_000)
  const requests = []
  page.on('request', (r) => {
    if (/pyodide|\.worker-|uadehub\.worker/.test(r.url())) requests.push(r.url())
  })
  const d = demo(page)
  await jumpTo(page, '#case-uadehub')
  await expect(d.open).toHaveAttribute('aria-expanded', 'false')
  await expect(d.region).toHaveCount(0) // la terminal ni siquiera está montada
  expect(requests, 'nada de Python antes de usar la demo').toEqual([])

  await openDemo(page)
  await expect(d.log).toContainText('Nombre:', { timeout: BOOT_TIMEOUT })
  const origin = new URL(page.url()).origin
  expect(requests.some((u) => u.endsWith('/pyodide/pyodide.asm.wasm'))).toBe(true)
  expect(requests.every((u) => u.startsWith(origin)), `requests fuera del sitio:\n${requests.join('\n')}`).toBe(true)
})

test('abre, inicia sesión, reserva un lugar, reinicia y cierra devolviendo el foco', async ({ page }) => {
  test.setTimeout(180_000)
  const d = await openDemo(page)

  // Carga: la fila de bloques con su aviso, y después el programa real
  await expect(d.log).toContainText('=== Inicio de sesión en UADE Desk Finder ===', { timeout: BOOT_TIMEOUT })
  await expect(d.log).toContainText('Nombre:')
  await expect(d.region).toContainText('Python 3.14 en tu navegador · ejecutando main.py')
  await expect(d.restart).toBeEnabled()
  await expect(d.input).toBeFocused() // el input en línea toma el foco al pedir la primera línea
  // La figura queda oculta: la terminal ocupa su lugar
  await expect(d.figure).toBeHidden()

  // Login con validación del legajo
  await answer(d, 'Ana Perez', 'Legajo (7 dígitos):')
  await answer(d, '123', 'El legajo debe tener 7 dígitos')
  await answer(d, '1234567', 'Cuenta creada para Ana Perez (Legajo: 1234567).')
  await expect(d.log).toContainText('Elegí una opción:')
  await expect(d.input).toBeFocused() // Enter no hace perder el foco

  // Reservar: piso 1, privados, hoy. El lugar 1 ya lo reservó otra estudiante (datos semilla)
  await answer(d, '2', 'Elegí el número del piso')
  await answer(d, '1', 'Elegí el tipo de lugar')
  await answer(d, '1', 'Elegí una fecha')
  await answer(d, '1', 'Elegí el número del lugar que querés reservar')
  await expect(d.log).toContainText('Lugar 1: ❌ Ocupado')
  await expect(d.log).toContainText('Lugar 2: ✅ Libre')
  await answer(d, '2', '¿Querés hacer otra reserva? (s/n):')
  await expect(d.log).toContainText(/¡Listo Ana Perez! Reservaste el Piso 10-Uade Comunitario \| privados \| Lugar 2/)
  await answer(d, 'n', 'Elegí una opción:')

  // La salida tiene scroll propio y queda abajo, en la última línea
  const term = await d.log.evaluate((el) => {
    const t = el.parentElement
    return { scrolls: t.scrollHeight > t.clientHeight, atBottom: t.scrollHeight - t.scrollTop - t.clientHeight < 2, lenis: t.hasAttribute('data-lenis-prevent') }
  })
  expect(term).toEqual({ scrolls: true, atBottom: true, lenis: true })

  // Reiniciar: borra los datos y vuelve a empezar, sin recargar Python
  await d.restart.click()
  await expect(d.log).toContainText('Nombre:', { timeout: STEP_TIMEOUT })
  await expect(d.log).not.toContainText('Ana Perez')
  await expect(d.input).toBeFocused()
  await answer(d, 'Martina Lopez', 'Legajo (7 dígitos):')
  await answer(d, '1100001', '¡Bienvenido de nuevo, Martina Lopez!')

  // Cerrar: vuelve la figura y el foco al botón
  await d.close.click()
  await expect(d.region).toBeHidden()
  await expect(d.open).toHaveAttribute('aria-expanded', 'false')
  await expect(d.open).toBeFocused()
  await expect(d.figure).toBeVisible()

  // Reabrir conserva la sesión
  await d.open.click()
  await expect(d.log).toContainText('¡Bienvenido de nuevo, Martina Lopez!')
})

test('"Probar en vivo" y "Ver arquitectura" se excluyen; salir del programa pasa el foco a Reiniciar', async ({ page }) => {
  test.setTimeout(150_000)
  const d = await openDemo(page)
  await expect(d.log).toContainText('Nombre:', { timeout: BOOT_TIMEOUT })

  await d.arch.click()
  await expect(d.arch).toHaveAttribute('aria-expanded', 'true')
  await expect(d.open).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#more-uadehub')).toBeVisible()
  await expect(d.region).toBeHidden()

  await d.open.click()
  await expect(d.open).toHaveAttribute('aria-expanded', 'true')
  await expect(d.arch).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#more-uadehub')).toBeHidden()
  await expect(d.region).toBeVisible()
  await expect(d.open).toHaveAttribute('aria-controls', 'live-uadehub')

  await d.input.click()
  await answer(d, 'Tomas Gomez', 'Legajo (7 dígitos):')
  await answer(d, '1100002', 'Elegí una opción:')
  await answer(d, '0', '[Programa finalizado]')
  await expect(d.region).toContainText('Programa finalizado · Reiniciar para volver a empezar')
  await expect(d.input).toBeHidden()
  await expect(d.restart).toBeFocused()
})

test('doble clic en Reiniciar deja un solo programa corriendo', async ({ page }) => {
  test.setTimeout(150_000)
  // Regresión live-restart-race: dos "restart" seguidos lanzaban dos main.py en paralelo (encabezado
  // doble y la línea del usuario perdida). El worker ahora reinicia en serie.
  const d = await openDemo(page)
  await expect(d.log).toContainText('Nombre:', { timeout: BOOT_TIMEOUT })

  await d.restart.dblclick()
  // Contestar asegura que las dos ejecuciones (si hay dos) ya imprimieron su encabezado
  await answer(d, 'Ana', 'Legajo (7 dígitos):')
  const text = await d.log.textContent()
  expect(text.split('=== Inicio de sesión').length - 1, 'el encabezado del login, una sola vez').toBe(1)
  expect(text).toMatch(/^=== Inicio de sesión/)
})

test('terminal: entra entera, nada la tapa y no hay scroll horizontal', async ({ page }) => {
  test.setTimeout(150_000)
  const d = await openDemo(page)
  await expect(d.log).toContainText('Nombre:', { timeout: BOOT_TIMEOUT })
  await answer(d, 'Ana', 'Legajo')
  await answer(d, '1234567', 'Elegí una opción:')
  await waitForAnimationsToFinish(page)
  await d.region.evaluate((el) => el.scrollIntoView({ block: 'nearest' }))
  await expectNoHorizontalOverflow(page)

  const box = await d.region.boundingBox()
  const viewport = page.viewportSize()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.height, 'alto fijo con scroll propio').toBeLessThanOrEqual(Math.max(600, viewport.height))
  const covered = await findCoveredContent(page, '#live-uadehub', { selector: 'p, button' })
  expect(covered, 'controles o ayudas de la terminal tapados').toEqual([])

  // En mobile y tablet va debajo del texto del caso
  if (viewport.width < 1024) {
    const body = await d.article.locator('h3').boundingBox()
    expect(box.y).toBeGreaterThan(body.y)
  }
})

test('axe y contraste AA con la terminal abierta', async ({ page }) => {
  test.setTimeout(150_000)
  test.skip(!['desktop', 'mobile'].includes(test.info().project.name), 'Una vez por tamaño alcanza')
  const d = await openDemo(page)
  await expect(d.log).toContainText('Nombre:', { timeout: BOOT_TIMEOUT })
  await answer(d, 'Ana', 'Legajo')
  await waitForAnimationsToFinish(page)
  await expectNoA11yViolations(page, { include: '#live-uadehub' })
  await expectReadableContrast(page, '#live-uadehub')
})

test('box9: valida entradas, agrega empleados, calcula el mejor y sale', async ({ page }) => {
  test.setTimeout(180_000)
  const requests = []
  page.on('request', (r) => {
    if (/\.worker/.test(r.url())) requests.push(r.url())
  })
  const d = await openDemo(page, 'box9')
  await expect(d.log).toContainText('Desea correr el programa?', { timeout: BOOT_TIMEOUT })
  await expect(d.region).toContainText('Python 3.14 en tu navegador · ejecutando main.py')
  await expect(d.input).toBeFocused()
  await expect(d.figure).toBeHidden()
  // Solo baja el worker de box9 (con su main.py), no el de uadeHUB
  expect(requests.some((u) => /box9\.worker/.test(u))).toBe(true)
  expect(requests.some((u) => /uadehub\.worker/.test(u))).toBe(false)

  // Una respuesta inválida se vuelve a pedir, sin cortar el programa
  await answer(d, 'hola', 'Valor invalido. Opciones validas: 1, -1')
  await answer(d, '1', 'Ingrese una opcion:')

  await answer(d, '2', 'Ingrese su nombre y apellido:')
  await answer(d, 'Ana Pérez', 'Ingrese su performance')
  await answer(d, '4', 'Ingrese su potencial')
  await answer(d, '5', 'Ana Pérez, agregado correctamente')

  await answer(d, '2', 'Ingrese su nombre y apellido:')
  await answer(d, 'Juan Gómez', 'Ingrese su performance')
  await answer(d, '9', 'Valor invalido. Opciones validas: 1, 2, 3, 4, 5')
  await answer(d, '5', 'Ingrese su potencial')
  await answer(d, '5', 'Juan Gómez, agregado correctamente')

  await answer(d, '4', 'El mejor empleado es: Juan Gómez con un puntaje de 25')

  // Reiniciar borra los empleados
  await d.restart.click()
  await expect(d.log).toContainText('Desea correr el programa?', { timeout: STEP_TIMEOUT })
  await expect(d.log).not.toContainText('Ana Pérez')
  await answer(d, '1', 'Ingrese una opcion:')
  await answer(d, '4', 'No hay empleados cargados.')

  // Salir: el programa termina y el foco pasa a Reiniciar
  await answer(d, '5', '[Programa finalizado]')
  await expect(d.input).toBeHidden()
  await expect(d.restart).toBeFocused()

  // Cerrar devuelve la figura y el foco al botón
  await d.close.click()
  await expect(d.region).toBeHidden()
  await expect(d.open).toBeFocused()
  await expect(d.figure).toBeVisible()
})

test('box9: axe y contraste AA con la terminal abierta', async ({ page }) => {
  test.setTimeout(150_000)
  test.skip(!['desktop', 'mobile'].includes(test.info().project.name), 'Una vez por tamaño alcanza')
  const d = await openDemo(page, 'box9')
  await expect(d.log).toContainText('Desea correr el programa?', { timeout: BOOT_TIMEOUT })
  await answer(d, '1', 'Ingrese una opcion:')
  await waitForAnimationsToFinish(page)
  await expectNoA11yViolations(page, { include: '#live-box9' })
  await expectReadableContrast(page, '#live-box9')
})
