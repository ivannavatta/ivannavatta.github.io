// Violaciones de Content-Security-Policy.
// La CSP solo existe en el build (vite build + vite preview), por eso el webServer por defecto
// corre el build. Escuchamos dos fuentes:
//   1. el evento `securitypolicyviolation` del documento (detalle: directiva y URL bloqueada);
//   2. los mensajes de consola "Refused to …" que emite Chromium.
// Lo usa el fixture automático `cspViolations` (fixtures.js), que falla el test si hay alguna.
// Importante: no usar `bypassCSP` en la config ni inyectar <style>/<script> inline desde los tests.

const BINDING = '__e2eReportCsp'

/**
 * @typedef {{ source: 'event' | 'console', directive?: string, blockedURI?: string, text: string }} CspViolation
 */

/**
 * Empieza a escuchar violaciones de CSP. Llamalo antes de `page.goto`.
 * @param {import('@playwright/test').Page} page
 * @param {{ allow?: RegExp[] }} [opts]
 */
export async function collectCspViolations(page, { allow = [] } = {}) {
  /** @type {CspViolation[]} */
  const violations = []
  const allowed = (text) => allow.some((re) => re.test(text))

  await page.exposeBinding(BINDING, (_source, v) => {
    const text = `[CSP ${v.disposition}] ${v.effectiveDirective} bloqueó ${v.blockedURI || '(inline)'}` +
      (v.sourceFile ? ` en ${v.sourceFile}:${v.lineNumber}` : '') +
      (v.sample ? ` · muestra: ${v.sample}` : '')
    if (allowed(text)) return
    violations.push({ source: 'event', directive: v.effectiveDirective, blockedURI: v.blockedURI, text })
  })

  // Los init scripts corren por el protocolo de DevTools: la CSP de la página no los bloquea.
  await page.addInitScript((binding) => {
    document.addEventListener('securitypolicyviolation', (e) => {
      const report = window[binding]
      if (typeof report !== 'function') return
      report({
        effectiveDirective: e.effectiveDirective,
        violatedDirective: e.violatedDirective,
        blockedURI: e.blockedURI,
        disposition: e.disposition,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber,
        sample: e.sample,
      })
    })
  }, BINDING)

  page.on('console', (msg) => {
    const text = msg.text()
    if (!/^Refused to /.test(text) && !/Content Security Policy/.test(text)) return
    if (allowed(text)) return
    violations.push({ source: 'console', text: `[consola] ${text}` })
  })

  return {
    violations,
    format() {
      return violations.map((v, i) => `${i + 1}. ${v.text}`).join('\n')
    },
  }
}

/** Patrón de los mensajes de consola de CSP (para que el colector de errores no los duplique). */
export const CSP_CONSOLE_PATTERN = /^Refused to |Content Security Policy/

/**
 * Lee la CSP efectiva del documento (header o <meta http-equiv>). Útil para asserts puntuales.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Response | null} [response] respuesta del goto
 */
export async function readCsp(page, response = null) {
  const header = response ? (await response.allHeaders())['content-security-policy'] : undefined
  const meta = await page.evaluate(
    () => document.querySelector('meta[http-equiv="Content-Security-Policy" i]')?.getAttribute('content') ?? null,
  )
  return { header: header ?? null, meta }
}
