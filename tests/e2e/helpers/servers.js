// Servidores de los tests e2e. Lo importan playwright.config.js y los specs.
//
//   BASE_URL  build normal (sin claves de EmailJS): lo que se publica hoy.
//   MAIL_URL  build con claves de EmailJS DE MENTIRA (FAKE_EMAILJS), en otro puerto y otro outDir,
//             para probar el envío con api.emailjs.com mockeado (stubEmailJs). Las claves no son
//             reales: aunque una llamada se escapara del mock, EmailJS la rechazaría.
// Nunca se versiona un .env: las variables se pasan solo al proceso del servidor (webServer.env).

export const HOST = '127.0.0.1'
export const PORT = Number(process.env.E2E_PORT || 5179)
export const MAIL_PORT = Number(process.env.E2E_MAIL_PORT || 5180)
export const BASE_URL = `http://${HOST}:${PORT}`
export const MAIL_URL = `http://${HOST}:${MAIL_PORT}`

/** Dentro de node_modules (ignorado por git) y separado de dist. */
export const MAIL_OUT_DIR = 'node_modules/.cache/e2e-dist-mail'

export const FAKE_EMAILJS = {
  VITE_EMAILJS_SERVICE_ID: 'service_prueba',
  VITE_EMAILJS_TEMPLATE_ID: 'template_prueba',
  VITE_EMAILJS_PUBLIC_KEY: 'clave_prueba',
}
