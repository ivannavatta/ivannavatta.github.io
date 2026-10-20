// `test` extendido para todos los specs del portfolio.
//
//   import { test, expect } from './helpers/index.js'
//
// Fixtures automáticos (corren en todos los tests, sin pedirlos):
//   pageErrors    recolecta console.error, pageerror y 4xx/5xx del propio sitio, y FALLA el test
//                 al terminar si quedó alguno. Ruido conocido: test.use({ allowedErrors: [/…/] }).
//                 Para revisar a mitad del test: assertNoPageErrors(pageErrors).
//   cspViolations escucha `securitypolicyviolation` y los "Refused to …" de consola, y FALLA el
//                 test si aparece alguno. Excepciones: test.use({ allowedCsp: [/…/] }).
//   noRealEmail   aborta cualquier request a api.emailjs.com que no esté mockeado. Los tests del
//                 formulario tienen que llamar a stubEmailJs(page) (network.js), que registra una
//                 ruta posterior y por eso tiene prioridad. Nunca se envían mails reales.
//
// Opciones:
//   allowedErrors  RegExp[] de errores a ignorar (por defecto, vacío).
//   allowedCsp     RegExp[] de violaciones de CSP a ignorar (por defecto, vacío).
//   failOnWarnings si true, también cuenta console.warn (por defecto false).
import { test as base, expect } from '@playwright/test'
import { collectPageErrors } from './console.js'
import { collectCspViolations, CSP_CONSOLE_PATTERN } from './csp.js'

export const EMAILJS_PATTERN = /^https:\/\/api\.emailjs\.com\//

export const test = base.extend({
  allowedErrors: [[], { option: true }],
  allowedCsp: [[], { option: true }],
  failOnWarnings: [false, { option: true }],

  noRealEmail: [
    async ({ page }, use) => {
      /** @type {string[]} */
      const blocked = []
      await page.route(EMAILJS_PATTERN, (route) => {
        blocked.push(route.request().url())
        return route.abort('blockedbyclient')
      })
      await use(blocked)
      expect(blocked, 'Se intentó llamar a EmailJS sin mock: usá stubEmailJs(page) en el test.').toEqual([])
    },
    { auto: true },
  ],

  cspViolations: [
    async ({ page, allowedCsp }, use, testInfo) => {
      const collector = await collectCspViolations(page, { allow: allowedCsp })
      await use(collector)
      if (collector.violations.length) {
        await testInfo.attach('violaciones-csp.txt', { body: collector.format(), contentType: 'text/plain' })
        if (testInfo.status === testInfo.expectedStatus) {
          expect(collector.violations, `Violaciones de CSP (${collector.violations.length}):\n${collector.format()}`).toEqual([])
        }
      }
    },
    { auto: true },
  ],

  pageErrors: [
    async ({ page, allowedErrors, failOnWarnings }, use, testInfo) => {
      // Los "Refused to …" de CSP los reporta cspViolations; acá no se duplican.
      const collector = collectPageErrors(page, { allow: [...allowedErrors, CSP_CONSOLE_PATTERN], warnings: failOnWarnings })
      await use(collector)
      if (collector.issues.length) {
        await testInfo.attach('errores-de-pagina.txt', { body: collector.format(), contentType: 'text/plain' })
        // Si el test ya falló por otra causa, no tapamos su mensaje.
        if (testInfo.status === testInfo.expectedStatus) {
          expect(collector.issues, `La página emitió ${collector.issues.length} error(es):\n${collector.format()}`).toEqual([])
        }
      }
    },
    { auto: true },
  ],
})

export { expect }
