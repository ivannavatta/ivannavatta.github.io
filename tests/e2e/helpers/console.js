// Recolecta errores de la página: console.error, excepciones no capturadas (pageerror) y
// respuestas 4xx/5xx del mismo origen (recursos rotos). Se usa a través del fixture
// `pageErrors` (ver fixtures.js), que falla el test al final si quedó alguno.

/**
 * @typedef {{ type: 'console' | 'pageerror' | 'response' | 'requestfailed', text: string, location?: string }} PageIssue
 */

/**
 * Empieza a escuchar errores en `page`. Llamalo antes de `page.goto`.
 * @param {import('@playwright/test').Page} page
 * @param {{ allow?: RegExp[], warnings?: boolean, sameOriginResponses?: boolean }} [opts]
 *   allow: patrones de texto a ignorar (ej. ruido conocido de terceros).
 *   warnings: si true, también cuenta console.warn.
 *   sameOriginResponses: si true (por defecto), cuenta 4xx/5xx y requests fallidos del propio sitio.
 */
export function collectPageErrors(page, { allow = [], warnings = false, sameOriginResponses = true } = {}) {
  /** @type {PageIssue[]} */
  const issues = []
  const allowed = (text) => allow.some((re) => re.test(text))
  const origin = () => {
    try {
      return new URL(page.url()).origin
    } catch {
      return ''
    }
  }

  page.on('console', (msg) => {
    const type = msg.type()
    if (type !== 'error' && !(warnings && type === 'warning')) return
    const text = msg.text()
    if (allowed(text)) return
    const loc = msg.location()
    issues.push({
      type: 'console',
      text: `[console.${type}] ${text}`,
      location: loc?.url ? `${loc.url}:${loc.lineNumber}:${loc.columnNumber}` : undefined,
    })
  })

  page.on('pageerror', (err) => {
    const text = `${err.name}: ${err.message}`
    if (allowed(text)) return
    issues.push({ type: 'pageerror', text, location: err.stack?.split('\n').slice(1, 3).join(' | ') })
  })

  if (sameOriginResponses) {
    page.on('response', (res) => {
      const status = res.status()
      if (status < 400) return
      const url = res.url()
      if (!url.startsWith(origin())) return
      const text = `[HTTP ${status}] ${url}`
      if (allowed(text)) return
      issues.push({ type: 'response', text })
    })
    page.on('requestfailed', (req) => {
      const url = req.url()
      if (!url.startsWith(origin())) return
      const failure = req.failure()?.errorText ?? 'failed'
      // Navegar o recargar cancela requests en vuelo: no es un error del sitio.
      if (/ERR_ABORTED|NS_BINDING_ABORTED/.test(failure)) return
      const text = `[request failed: ${failure}] ${url}`
      if (allowed(text)) return
      issues.push({ type: 'requestfailed', text })
    })
  }

  return {
    issues,
    /** Vacía la lista (por ejemplo, después de una acción que provoca un error esperado). */
    clear() {
      issues.length = 0
    },
    /** Texto legible para el mensaje de error del test. */
    format() {
      return issues.map((i, n) => `${n + 1}. ${i.text}${i.location ? `\n     at ${i.location}` : ''}`).join('\n')
    },
  }
}

/**
 * Falla si hay errores recolectados. Útil para chequear a mitad de un test.
 * @param {ReturnType<typeof collectPageErrors>} collector
 */
export function assertNoPageErrors(collector) {
  if (collector.issues.length) {
    throw new Error(`La página emitió ${collector.issues.length} error(es):\n${collector.format()}`)
  }
}
