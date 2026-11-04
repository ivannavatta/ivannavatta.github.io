// "Probar en vivo" en los casos Sistema de transporte, uadeHUB y box9
// (src/features/projects/components/live).
//
// La terminal corre el programa real de cada proyecto en un Web Worker propio (live/programs.js):
//   - uadeHUB y box9: su main.py con Pyodide (Python en WebAssembly). Pyodide se sirve desde el
//     propio sitio (public/pyodide/, lo copia scripts/copy-pyodide.mjs). Reiniciar se le avisa al
//     mismo worker, que relanza main.py sin recargar Python.
//   - Sistema de transporte: el Main.java del TPO compilado a JavaScript con TeaVM
//     (live/transporte.worker.js, sin Pyodide). Reiniciar descarta el worker y crea otro
//     (restart 'respawn'), porque los static de Java no se pueden volver a inicializar.
// Todo se descarga recién al tocar el botón y corre bajo la CSP real del build (script-src 'self';
// el webServer por defecto es build + preview): el fixture cspViolations falla el test ante
// cualquier violación.
//
// uadeHUB, datos semilla: Martina Lopez (1100001) y Tomas Gomez (1100002); Martina tiene reservado
// hoy el lugar 1 de "privados" en el Piso 10-Uade Comunitario. box9 arranca sin empleados.
// Transporte, datos de prueba: terminales BUE, COR, ROS, MDZ, SLA, TUC, SFE, NQN, BRC y POS; micros
// AA-001-AA a EE-015-EE (AA-001-AA y AA-002-AA con 3 asignaciones).
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
  scrollY,
  waitForScrollSettled,
  placeAt,
  startScrollTrace,
  scrollTrace,
  viewportFit,
  expectRevealed,
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

/**
 * Anota cada Web Worker que crea la página y si se terminó (window.__e2eWorkers). Los init scripts
 * corren por el protocolo de DevTools: la CSP no los bloquea. Sirve para saber cuántos programas
 * quedan vivos después de un reinicio por 'respawn'.
 */
async function trackWorkers(page) {
  await page.addInitScript(() => {
    const Native = window.Worker
    const all = []
    window.__e2eWorkers = all
    window.Worker = class extends Native {
      constructor(url, options) {
        super(url, options)
        const rec = { url: String(url), alive: true }
        all.push(rec)
        const terminate = this.terminate.bind(this)
        this.terminate = () => {
          rec.alive = false
          terminate()
        }
      }
    }
  })
}

/** Workers de un programa (por la URL del script): cuántos se crearon y cuántos siguen vivos. */
const workers = (page, re) =>
  page.evaluate((source) => {
    const mine = window.__e2eWorkers.filter((w) => new RegExp(source).test(w.url))
    return { created: mine.length, alive: mine.filter((w) => w.alive).length }
  }, re.source)

test.beforeEach(async ({ page }) => {
  await trackWorkers(page)
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

/* ---------------- Sistema de transporte: Main.java con TeaVM ---------------- */

const TRANSPORTE = 'Sistema de transporte'
const TRANSPORTE_WORKER = /transporte\.worker/
const MENU = 'SISTEMA DE GESTIÓN DE TRANSPORTE'
const PROMPT = 'Seleccione una opción:'
const JAVA_BOOT = 30_000 // el worker pesa ~75 KB con gzip; con 3 workers de Playwright y la escena 3D

/**
 * Escribe una línea, Enter, y espera `next` en la salida que aparece DESPUÉS de esa línea. El menú
 * del TPO repite sus textos ("Opción:", el encabezado), así que mirar todo el log daría por buena
 * una salida vieja.
 */
async function step(d, line, next) {
  const before = (await d.log.textContent()).length
  await d.input.fill(line) // espera a que el programa pida la línea (input editable)
  await d.input.press('Enter')
  await expect
    .poll(async () => (await d.log.textContent()).slice(before), { timeout: STEP_TIMEOUT, message: `después de "${line}"` })
    .toContain(next)
}

const count = (text, needle) => text.split(needle).length - 1

/** Abre transporte y espera el menú principal con el input pidiendo la opción. */
async function openTransporte(page) {
  const d = await openDemo(page, TRANSPORTE)
  await expect(d.log).toContainText(PROMPT, { timeout: JAVA_BOOT })
  await expect(d.input).toBeEditable()
  return d
}

test('transporte: Java (TeaVM) se descarga recién al tocar "Probar en vivo", desde el sitio y sin Pyodide', async ({ page }) => {
  test.setTimeout(90_000)
  const requests = []
  page.on('request', (r) => {
    if (/pyodide|\.worker|classes/.test(r.url())) requests.push(r.url())
  })
  const d = demo(page, TRANSPORTE)
  await jumpTo(page, '#case-transporte')
  await expect(d.open).toHaveAttribute('aria-expanded', 'false')
  await expect(d.region).toHaveCount(0) // la terminal ni siquiera está montada
  expect(requests, 'nada del programa antes de usar la demo').toEqual([])

  await openTransporte(page)
  await expect(d.open).toHaveAttribute('aria-controls', 'live-transporte')
  await expect(d.region).toContainText('Java (TeaVM) en tu navegador · ejecutando Main.java')
  await expect(d.log).toContainText(MENU)
  await expect(d.log).toContainText('4. Gestión de TERMINALES')
  await expect(d.log).toContainText('0. Salir del Sistema')
  await expect(d.restart).toBeEnabled()
  // (El foco del input y el desplazamiento hasta la terminal los cubren los tests de "se trae a la
  // vista", más abajo.)
  await expect(d.figure).toBeHidden() // la terminal ocupa el lugar del grafo
  await expect(d.region).toContainText('Probá 3 → 4: caminos de BUE a BRC')

  // Un solo script: el worker con el programa compilado adentro, del propio sitio. Ni Pyodide ni
  // los workers de Python.
  const origin = new URL(page.url()).origin
  expect(requests.filter((u) => TRANSPORTE_WORKER.test(u))).toHaveLength(1)
  expect(requests.every((u) => u.startsWith(origin)), `requests fuera del sitio:\n${requests.join('\n')}`).toBe(true)
  expect(requests.filter((u) => /pyodide|uadehub\.worker|box9\.worker/.test(u)), 'nada de Python').toEqual([])
  expect(await workers(page, TRANSPORTE_WORKER)).toEqual({ created: 1, alive: 1 })
})

test('transporte: caminos con DFS, micros con más asignaciones y error de entrada', async ({ page }) => {
  test.setTimeout(90_000)
  const d = await openTransporte(page)
  await expect(d.input).toBeFocused() // el input toma el foco al pedir la primera opción

  // Una opción que no es un número no corta el programa: avisa y vuelve al menú
  await step(d, 'x', 'Error: Por favor, ingrese un número válido.')
  await expect(d.input).toBeFocused()

  // Viajes → caminos con un máximo de paradas (DFS)
  await step(d, '3', '--- MÓDULO: GESTIÓN DE VIAJES ---')
  await step(d, '4', 'Código Terminal Origen:')
  await step(d, 'BUE', 'Código Terminal Destino:')
  await step(d, 'BRC', 'Establezca el máximo de paradas intermedias permitidas:')
  await step(d, '2', 'Rutas de BUE a BRC (máx 2 paradas):')
  await expect(d.log).toContainText('-> BUE -> NQN -> BRC [Paradas: 1]')
  await expect(d.log).toContainText('-> BUE -> MDZ -> BRC [Paradas: 1]')
  await step(d, '0', PROMPT) // vuelve al menú principal

  // Micros → los de más asignaciones
  await step(d, '1', '--- MODULO: GESTIÓN DE MICROS ---')
  await step(d, '2', '--- Micros con mayor cantidad de asignaciones ---')
  await expect(d.log).toContainText('-> Patente: [AA-001-AA] | Tipo: CAMA | Asignaciones: 3')
  await expect(d.log).toContainText('-> Patente: [AA-002-AA] | Tipo: SEMI-CAMA | Asignaciones: 3')

  // Lo tipeado queda en la salida y la terminal sigue abajo, con scroll propio fuera de Lenis
  await expect(d.log.locator('.typed', { hasText: 'BRC' })).toHaveCount(1)
  const term = await d.log.evaluate((el) => {
    const t = el.parentElement
    return { scrolls: t.scrollHeight > t.clientHeight, atBottom: t.scrollHeight - t.scrollTop - t.clientHeight < 2, lenis: t.hasAttribute('data-lenis-prevent') }
  })
  expect(term).toEqual({ scrolls: true, atBottom: true, lenis: true })
})

test('transporte: Reiniciar a mitad de un input crea un worker nuevo con los datos de prueba', async ({ page }) => {
  test.setTimeout(90_000)
  const d = await openTransporte(page)

  // Se agrega una terminal y aparece en el listado
  await step(d, '4', '--- MÓDULO: GESTIÓN DE TERMINALES ---')
  await step(d, '1', 'Ingrese código de Terminal (3 letras - ej. AEP):')
  await step(d, 'AEP', 'Ingrese descripción/nombre de la Terminal:')
  await step(d, 'Aeroparque', '¡Terminal añadida correctamente!')
  await step(d, '3', 'Terminales operadas:')
  await expect(d.log).toContainText('• [AEP] Aeroparque')

  // A mitad de otra alta (el programa espera el código), Reiniciar
  await step(d, '1', 'Ingrese código de Terminal')
  await expect(d.input).toBeEditable()
  await d.input.fill('ZZZ') // algo a medio escribir: no tiene que llegar a ningún programa
  await d.restart.click()

  // Arranca de cero: solo el menú principal, sin restos de la salida vieja
  await expect(d.log).toContainText(PROMPT, { timeout: STEP_TIMEOUT })
  await expect(d.input).toBeEditable()
  await expect(d.input).toHaveValue('')
  await expect(d.input).toBeFocused()
  const text = await d.log.textContent()
  expect(text.trim().startsWith('====='), `la salida arranca con el encabezado:\n${text.slice(0, 120)}`).toBe(true)
  expect(count(text, MENU), 'el menú, una sola vez').toBe(1)
  expect(text).not.toMatch(/AEP|Aeroparque|MÓDULO|ZZZ/)
  expect(text.trimEnd().endsWith(PROMPT)).toBe(true)
  // El worker viejo se terminó: queda uno solo
  expect(await workers(page, TRANSPORTE_WORKER)).toEqual({ created: 2, alive: 1 })

  // Los datos volvieron a los de prueba: AEP ya no existe
  await step(d, '4', '--- MÓDULO: GESTIÓN DE TERMINALES ---')
  await step(d, '3', 'Terminales operadas:')
  await expect(d.log).toContainText('• [BUE] Retiro Buenos Aires')
  await expect(d.log).toContainText('• [POS] Posadas Misiones')
  await expect(d.log).not.toContainText('AEP')
})

test('transporte: doble clic en Reiniciar arranca un solo menú', async ({ page }) => {
  test.setTimeout(90_000)
  const d = await openTransporte(page)
  await step(d, '3', '--- MÓDULO: GESTIÓN DE VIAJES ---')

  await d.restart.dblclick()
  await expect(d.log).toContainText(PROMPT, { timeout: STEP_TIMEOUT })
  await expect(d.input).toBeEditable()
  // Contestar asegura que, si hubiera dos programas, los dos ya imprimieron su menú
  await step(d, 'x', 'Error: Por favor, ingrese un número válido.')
  await expect(d.log).toContainText(PROMPT)
  const text = await d.log.textContent()
  expect(text).not.toContain('VIAJES ---')
  expect(count(text, 'Error: Por favor'), 'la línea llegó a un solo programa').toBe(1)
  expect(count(text, MENU), 'el menú inicial y el de después del error').toBe(2)
  expect(await workers(page, TRANSPORTE_WORKER)).toEqual({ created: 3, alive: 1 })
})

test('transporte: salir con 0 termina el programa; Reiniciar después vuelve a empezar', async ({ page }) => {
  test.setTimeout(90_000)
  const d = await openTransporte(page)

  await step(d, '0', '[Programa finalizado]')
  await expect(d.log).toContainText('Saliendo...')
  await expect(d.region).toContainText('Programa finalizado · Reiniciar para volver a empezar')
  await expect(d.input).toBeHidden()
  await expect(d.region.locator('input')).toBeDisabled() // oculto: getByRole ya no lo encuentra
  await expect(d.restart).toBeFocused()

  // Reiniciar con el teclado (el foco ya está ahí)
  await page.keyboard.press('Enter')
  await expect(d.log).toContainText(PROMPT, { timeout: STEP_TIMEOUT })
  await expect(d.input).toBeEditable()
  await expect(d.input).toBeFocused()
  await expect(d.region).toContainText('Java (TeaVM) en tu navegador · ejecutando Main.java')
  await expect(d.log).not.toContainText('Saliendo...')
  await expect(d.log).not.toContainText('[Programa finalizado]')
  expect(await workers(page, TRANSPORTE_WORKER)).toEqual({ created: 2, alive: 1 })

  // Cerrar devuelve el grafo y el foco al botón; reabrir conserva la sesión
  await step(d, '4', '--- MÓDULO: GESTIÓN DE TERMINALES ---')
  await d.close.click()
  await expect(d.region).toBeHidden()
  await expect(d.open).toHaveAttribute('aria-expanded', 'false')
  await expect(d.open).toBeFocused()
  await expect(d.figure).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(d.region).toBeVisible()
  await expect(d.log).toContainText('--- MÓDULO: GESTIÓN DE TERMINALES ---')
  expect(await workers(page, TRANSPORTE_WORKER)).toEqual({ created: 2, alive: 1 })
})

test('transporte: "Probar en vivo" y "Ver arquitectura" se excluyen', async ({ page }) => {
  test.setTimeout(90_000)
  const d = await openTransporte(page)
  await d.arch.click()
  await expect(d.arch).toHaveAttribute('aria-expanded', 'true')
  await expect(d.open).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#more-transporte')).toBeVisible()
  await expect(d.region).toBeHidden()

  await d.open.click()
  await expect(d.arch).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#more-transporte')).toBeHidden()
  await expect(d.region).toBeVisible()
  await d.input.click()
  await step(d, '3', '--- MÓDULO: GESTIÓN DE VIAJES ---') // la sesión siguió viva
})

test('transporte: la terminal entra entera, nada la tapa y no hay scroll horizontal', async ({ page }) => {
  test.setTimeout(90_000)
  const d = await openTransporte(page)
  // Líneas largas del TPO (los menús de 60 caracteres y el reporte de micros)
  await step(d, '1', '--- MODULO: GESTIÓN DE MICROS ---')
  await step(d, '2', 'Asignaciones: 3')
  await waitForAnimationsToFinish(page)
  await d.region.evaluate((el) => el.scrollIntoView({ block: 'nearest' }))
  await expectNoHorizontalOverflow(page)

  const box = await d.region.boundingBox()
  const viewport = page.viewportSize()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.height, 'alto fijo con scroll propio').toBeLessThanOrEqual(Math.max(600, viewport.height))
  const covered = await findCoveredContent(page, '#live-transporte', { selector: 'p, button' })
  expect(covered, 'controles o ayudas de la terminal tapados').toEqual([])

  // Las líneas largas no desbordan la terminal: se cortan o la terminal tiene scroll propio
  const wide = await d.log.evaluate((el) => {
    const t = el.parentElement
    return { overflowX: getComputedStyle(t).overflowX, wider: t.scrollWidth > t.clientWidth + 1 }
  })
  expect(!wide.wider || ['auto', 'scroll'].includes(wide.overflowX), `línea más ancha que la terminal: ${JSON.stringify(wide)}`).toBe(true)

  if (viewport.width < 1024) {
    const body = await d.article.locator('h3').boundingBox()
    expect(box.y).toBeGreaterThan(body.y)
  }
})

test('transporte: axe y contraste AA con la terminal abierta', async ({ page }) => {
  test.setTimeout(90_000)
  test.skip(!['desktop', 'mobile'].includes(test.info().project.name), 'Una vez por tamaño alcanza')
  const d = await openTransporte(page)
  await step(d, 'x', 'Error: Por favor')
  await waitForAnimationsToFinish(page)
  await expectNoA11yViolations(page, { include: '#live-transporte' })
  await expectReadableContrast(page, '#live-transporte')
})

/* ---------------- Al abrir, la terminal se trae a la vista (useRevealOnOpen) ---------------- */
// Debajo de 1024 px la terminal se abre debajo del texto del caso (560 px de alto, o 72svh). Si el
// botón está abajo de la pantalla, la página se desplaza lo justo para mostrarla entera (como
// scrollIntoView({ block: 'nearest' }), con 16 px de aire y dejando libre la barra fija): con Lenis
// en 0,6 s, con movimiento reducido de un salto. Al terminar, si el programa pide una línea, el
// input toma el foco. Con los casos apilados (pin de escritorio) no se mueve nada.

const isNarrow = () => (test.info().project.use.viewport?.width ?? 1440) < 1024
const isReduced = () => test.info().project.use.reducedMotion === 'reduce'
const REVEAL_GAP = 16 // useRevealOnOpen: aire entre el bloque y el borde de la pantalla

/** Con movimiento, el desplazamiento se anima (Lenis); con movimiento reducido es un salto. */
function expectRevealMotion(trace) {
  if (isReduced()) expect(trace.steps, `reducido: un salto, sin pasos intermedios (${JSON.stringify(trace)})`).toBe(0)
  else expect(trace.steps, `con movimiento: desplazamiento animado (${JSON.stringify(trace)})`).toBeGreaterThan(3)
}

test.describe('mobile y tablet: la terminal se trae a la vista al abrirse', () => {
  test.beforeEach(() => {
    test.skip(!isNarrow(), 'Debajo de 1024 px la terminal se abre debajo del texto del caso')
  })

  test('transporte: con el botón en el tercio de abajo, la terminal queda entera bajo la barra y el input con foco', async ({ page }) => {
    test.setTimeout(90_000)
    const d = demo(page, TRANSPORTE)
    const vh = page.viewportSize().height
    const box = await placeAt(page, d.open, 0.85)
    expect(box.y, 'el botón quedó en el tercio de abajo').toBeGreaterThan((vh * 2) / 3)
    expect(box.y + box.height, 'y entero en pantalla').toBeLessThanOrEqual(vh)
    const y0 = await scrollY(page)

    await startScrollTrace(page)
    await d.open.click()
    await expect(d.region).toBeVisible()
    await expectRevealed(d.region, 'terminal de transporte')
    await expect(d.input).toBeFocused({ timeout: JAVA_BOOT })
    await expect(d.log).toContainText(PROMPT)
    await waitForScrollSettled(page)

    const trace = await scrollTrace(page)
    expect(trace.to - y0, 'la página bajó hasta la terminal').toBeGreaterThan(100)
    expectRevealMotion(trace)
    // Lo justo, no de más: el borde de abajo queda a ~16 px del borde de la pantalla
    const fit = await viewportFit(d.region)
    expect(vh - fit.bottom, `aire debajo de la terminal (${JSON.stringify(fit)})`).toBeGreaterThanOrEqual(REVEAL_GAP - 2)
    expect(vh - fit.bottom, `aire debajo de la terminal (${JSON.stringify(fit)})`).toBeLessThanOrEqual(REVEAL_GAP + 8)
    // El botón que la abrió sigue a la vista (la terminal no lo empujó fuera de pantalla)
    await expect(d.open).toBeInViewport()

    // Con el foco ahí, se escribe directo (keyboard.type: sin el scrollIntoView de fill)
    const before = (await d.log.textContent()).length
    await page.keyboard.type('3')
    await page.keyboard.press('Enter')
    await expect
      .poll(async () => (await d.log.textContent()).slice(before), { timeout: STEP_TIMEOUT })
      .toContain('--- MÓDULO: GESTIÓN DE VIAJES ---')
    await expectRevealed(d.region, 'terminal después de escribir')
  })

  test('transporte: cerrar, bajar el botón y reabrir con Enter la trae de nuevo y enfoca el programa que esperaba', async ({ page }) => {
    test.setTimeout(90_000)
    const d = await openTransporte(page) // ya arrancó: el programa espera una opción
    await d.close.click()
    await expect(d.region).toBeHidden()
    await expect(d.open).toBeFocused()

    const vh = page.viewportSize().height
    const box = await placeAt(page, d.open, 0.85)
    expect(box.y).toBeGreaterThan((vh * 2) / 3)
    await expect(d.open).toBeFocused() // el salto no le quita el foco al botón
    const y0 = await scrollY(page)

    await startScrollTrace(page)
    await page.keyboard.press('Enter')
    await expect(d.region).toBeVisible()
    await expectRevealed(d.region, 'terminal reabierta')
    // El programa ya estaba esperando: el foco llega al terminar el desplazamiento (focusIfWaiting)
    await expect(d.input).toBeFocused()
    await waitForScrollSettled(page)
    const trace = await scrollTrace(page)
    expect(trace.to - y0, 'la página bajó hasta la terminal').toBeGreaterThan(100)
    expectRevealMotion(trace)
    expect(await workers(page, TRANSPORTE_WORKER), 'reabrir no crea otro programa').toEqual({ created: 1, alive: 1 })
  })

  test('transporte: si al abrirse ya entra entera, la página no se mueve', async ({ page }) => {
    test.setTimeout(90_000)
    const d = demo(page, TRANSPORTE)
    // El botón arriba, justo debajo de la barra: la terminal (560 px como mucho) entra debajo
    await placeAt(page, d.open, 0.14)
    await waitForScrollSettled(page)
    await startScrollTrace(page)
    await d.open.click()
    await expect(d.region).toBeVisible()
    await expect(d.input).toBeFocused({ timeout: JAVA_BOOT }) // se ve: el input toma el foco igual
    await waitForAnimationsToFinish(page, '#case-transporte')
    await waitForScrollSettled(page)
    await expectRevealed(d.region, 'terminal')
    const trace = await scrollTrace(page)
    expect(trace.maxDrift, `scrollY se movió (${JSON.stringify(trace)})`).toBeLessThan(1)
  })

  test('uadeHUB: abierta desde abajo, se trae a la vista y el input toma el foco cuando Python termina de cargar', async ({ page }) => {
    test.setTimeout(150_000)
    test.skip(test.info().project.name !== 'mobile', 'Pyodide es pesado: una vez alcanza (transporte cubre los demás tamaños)')
    const d = demo(page)
    const vh = page.viewportSize().height
    const box = await placeAt(page, d.open, 0.85)
    expect(box.y).toBeGreaterThan((vh * 2) / 3)
    const y0 = await scrollY(page)

    await startScrollTrace(page)
    await d.open.click()
    await expect(d.region).toBeVisible()
    // Mientras carga Python, la terminal (con la fila de bloques) ya se ve entera
    await expectRevealed(d.region, 'terminal de uadeHUB cargando')
    await expect(d.log).toContainText('Nombre:', { timeout: BOOT_TIMEOUT })
    await expect(d.input).toBeFocused()
    await expectRevealed(d.region, 'terminal de uadeHUB lista')
    const trace = await scrollTrace(page)
    expect(trace.to - y0).toBeGreaterThan(100)
  })
})

/* Escritorio con los casos apilados: abrir la terminal no mueve la página */
for (const size of [
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
]) {
  test.describe(`${size.width}×${size.height} apilado`, () => {
    test.use({ viewport: { width: size.width, height: size.height } })
    test.beforeEach(() => {
      test.skip(test.info().project.name !== 'desktop', 'Tamaño fijo: corre solo en el proyecto desktop')
    })

    test('transporte: abrir la terminal no mueve scrollY y el input toma el foco', async ({ page }) => {
      test.setTimeout(90_000)
      const d = demo(page, TRANSPORTE)
      await expect(page.locator('#proyectos .pin-spacer'), 'hay pin (casos apilados)').toHaveCount(1)
      // El foco de teclado trae el caso al frente del apilado
      await keyboardFocus(page, d.open)
      await waitForAnimationsToFinish(page, '#proyectos')
      await waitForScrollSettled(page)
      await expect(d.open).toBeInViewport({ ratio: 1 })

      await startScrollTrace(page)
      await page.keyboard.press('Enter')
      await expect(d.region).toBeVisible()
      expect(await d.region.evaluate((el) => !!el.closest('.pin-spacer')), 'la terminal está dentro del pin').toBe(true)
      await expect(d.input).toBeFocused({ timeout: JAVA_BOOT })
      await waitForAnimationsToFinish(page, '#case-transporte')
      await waitForScrollSettled(page)
      const trace = await scrollTrace(page)
      expect(trace.maxDrift, `scrollY se movió con los casos apilados (${JSON.stringify(trace)})`).toBeLessThan(1)
      await expect(d.region).toBeInViewport({ ratio: 1 })
    })
  })
}
