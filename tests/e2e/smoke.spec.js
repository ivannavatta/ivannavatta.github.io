// Smoke: la home carga sin errores y sin scroll horizontal, arriba de todo y después de recorrerla
// entera con la rueda. Corre en los cinco proyectos (desktop, tablet, mobile y sus variantes con
// movimiento reducido). Los errores de consola y las violaciones de CSP los controlan los fixtures
// automáticos `pageErrors` y `cspViolations`.
import {
  test,
  expect,
  waitForAppReady,
  expectNoHorizontalOverflow,
  wheelToBottom,
  readCsp,
} from './helpers/index.js'

test.describe('smoke', () => {
  test('la home carga sin errores de consola ni overflow horizontal', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok(), `HTTP ${response?.status()}`).toBe(true)

    await waitForAppReady(page)

    await expect(page).toHaveTitle(/Ivan Navatta/)
    await expect(page.locator('html')).toHaveAttribute('lang', /^es/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await expectNoHorizontalOverflow(page)
  })

  test('el build declara una Content-Security-Policy', async ({ page }) => {
    test.skip(process.env.E2E_SERVER === 'dev', 'La CSP solo existe en el build (preview)')
    const response = await page.goto('/')
    const { header, meta } = await readCsp(page, response)
    const csp = header ?? meta
    expect(csp, 'No hay CSP ni en el header ni en <meta http-equiv>').toBeTruthy()
    expect(csp).toMatch(/default-src|script-src/)
  })

  test('recorrer la página con la rueda no rompe el layout ni tira errores', async ({ page }) => {
    await page.goto('/')
    await waitForAppReady(page)

    await wheelToBottom(page)
    await expectNoHorizontalOverflow(page)

    // La última sección (contacto, con el pie) tiene que quedar a la vista al final.
    await expect(page.locator('footer').last()).toBeInViewport()
  })
})
