// Stubs de servicios de terceros. Los tests nunca mandan mensajes reales: además de este stub,
// el fixture automático `noRealEmail` aborta (y hace fallar) cualquier llamada a EmailJS sin mock.

/**
 * Mockea EmailJS (`https://api.emailjs.com/**`) y responde sin enviar nada.
 * Registrarlo después del fixture le da prioridad sobre el bloqueo de `noRealEmail`.
 * Devuelve la lista de envíos interceptados para verificar el payload.
 * @param {import('@playwright/test').Page} page
 * @param {{ status?: number, body?: string, delayMs?: number }} [opts]
 *   status 200 simula éxito; 4xx/5xx simulan error del servicio; delayMs, el estado "Enviando…".
 */
export async function stubEmailJs(page, { status = 200, body = 'OK', delayMs = 0 } = {}) {
  /** @type {Array<{ url: string, method: string, postData: string | null }>} */
  const calls = []
  await page.route('https://api.emailjs.com/**', async (route) => {
    const req = route.request()
    calls.push({ url: req.url(), method: req.method(), postData: req.postData() })
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs))
    await route.fulfill({ status, body, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' } })
  })
  return calls
}

/**
 * Bloquea cualquier request a dominios externos que no estén en `allow` (fuentes, CDNs, analytics).
 * Útil para tests deterministas o para verificar que el sitio no depende de terceros para funcionar.
 * @param {import('@playwright/test').Page} page
 * @param {{ allow?: RegExp[] }} [opts]
 */
export async function blockThirdParty(page, { allow = [] } = {}) {
  const blocked = []
  await page.route(
    (url) => !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url.href),
    async (route) => {
      const url = route.request().url()
      if (allow.some((re) => re.test(url))) return route.continue()
      blocked.push(url)
      return route.abort('blockedbyclient')
    },
  )
  return blocked
}
