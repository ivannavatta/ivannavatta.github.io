// Configuración de Playwright Test para el portfolio.
//
// Servidor (puerto fijo propio 5179, para no chocar con el `npm run dev` del 5173):
//   - Por defecto: `npm run build` + `vite preview`. La CSP solo se inyecta en el build, así que
//     es la única forma de testear bajo la CSP real. Recompila en cada corrida (no reutiliza un
//     servidor viejo, para no testear un build desactualizado).
//   - E2E_SERVER=dev: `vite` en modo dev, más rápido para iterar, pero SIN CSP.
//       PowerShell: $env:E2E_SERVER='dev'; npm run test:e2e
//   - E2E_REUSE=1 reutiliza un servidor que ya esté escuchando en el puerto.
//
// Proyectos (todos en Chromium):
//   desktop 1440x900 · tablet 768x1024 · mobile 375x812 (touch)
//   desktop-reduced y mobile-reduced: igual, con prefers-reduced-motion: reduce
import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT || 5179)
const HOST = '127.0.0.1'
const BASE_URL = `http://${HOST}:${PORT}`
const usePreview = process.env.E2E_SERVER !== 'dev'
const reuse = process.env.E2E_REUSE === '1' || (!usePreview && !process.env.CI)
const isCI = !!process.env.CI

// WebGL en headless. Con SwiftShader (software) la escena three.js corre a 2-8 fps y cada
// mouse.wheel tarda ~500 ms: los tests de scroll se vuelven lentísimos. En Windows usamos la GPU
// por D3D11 (~60 fps). En Linux/CI, SwiftShader. Se fuerza con E2E_GL=gpu | swiftshader.
const GL = process.env.E2E_GL || (process.platform === 'win32' ? 'gpu' : 'swiftshader')
const GL_ARGS =
  GL === 'gpu'
    ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
    : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']

const chromium = devices['Desktop Chrome']

const desktop = { ...chromium, viewport: { width: 1440, height: 900 } }
const tablet = {
  ...chromium,
  viewport: { width: 768, height: 1024 },
  hasTouch: true,
}
const mobile = {
  ...chromium,
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // La escena 3D es pesada (más con SwiftShader): pocos workers evitan timeouts falsos.
  workers: isCI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    launchOptions: { args: GL_ARGS },
  },

  projects: [
    { name: 'desktop', use: { ...desktop } },
    { name: 'tablet', use: { ...tablet } },
    { name: 'mobile', use: { ...mobile } },
    { name: 'desktop-reduced', use: { ...desktop, reducedMotion: 'reduce' } },
    { name: 'mobile-reduced', use: { ...mobile, reducedMotion: 'reduce' } },
  ],

  webServer: {
    command: usePreview
      ? `npm run build && npm run preview -- --host ${HOST} --port ${PORT} --strictPort`
      : `npx vite --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: reuse,
    timeout: usePreview ? 180_000 : 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
