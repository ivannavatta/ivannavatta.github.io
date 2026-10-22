// Costuras entre capítulos y tema de la cabecera (src/features/stage/engine/seams.js y theme.js).
//
// Cada sección pinta su fondo según data-theme; en cada borde claro/oscuro, una fila de bloques
// de 48 px sube atada al scroll. Para cada borde se barre el scroll en pasos de 20 px, desde que el
// borde asoma por el pie de la pantalla hasta que pasa por debajo de la cabecera, y en cada paso:
//   - contraste AA del texto visible de las dos secciones (contando los bloques detrás del texto);
//   - ningún texto con un bloque de costura encima;
//   - <html data-surface> y meta theme-color coinciden con el color real bajo la cabecera.
import {
  test,
  expect,
  waitForAppReady,
  jumpTo,
  waitForAnimationsToFinish,
  measureTextContrast,
  findTextUnderSeams,
  surfaceUnderHeader,
  borderSweep,
  SEAM_BLOCKS,
  SECTIONS,
} from './helpers/index.js'

const isReducedProject = () => test.info().project.use.reducedMotion === 'reduce'

// Pares de capítulos consecutivos: [anterior, siguiente]
const BORDERS = SECTIONS.slice(1).map((s, i) => [SECTIONS[i].id, s.id])

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await waitForAppReady(page)
})

test('con movimiento hay una costura por cada borde claro/oscuro; con reducido, ninguna', async ({ page }) => {
  const info = await page.evaluate((blocksSel) => {
    const strips = new Set([...document.querySelectorAll(blocksSel)].map((b) => b.parentElement))
    const sections = [...document.querySelectorAll('main > section[data-chapter]')]
    const live = document.documentElement.classList.contains('live')
    const themeOf = (el) => (live && el.dataset.backdrop) || el.dataset.theme
    let changes = 0
    for (let i = 1; i < sections.length; i++) if (themeOf(sections[i]) !== themeOf(sections[i - 1])) changes++
    return { strips: strips.size, changes }
  }, SEAM_BLOCKS)
  if (isReducedProject()) expect(info.strips).toBe(0)
  else {
    expect(info.changes).toBeGreaterThan(0)
    expect(info.strips).toBe(info.changes)
  }
})

for (const [prev, next] of BORDERS) {
  test(`borde ${prev} → ${next}: contraste AA y nada tapado por la costura (pasos de 20 px)`, async ({ page }) => {
    test.setTimeout(180_000)
    const roots = [`#${prev}`, `#${next}`]
    const contrast = []
    const covered = []
    // 20 px mientras la costura se arma (el borde va del pie de la pantalla al 50 %, seams.js RANGE)
    // y 40 px después, cuando el borde ya está recto y solo sube hasta la cabecera
    const ys = [
      ...(await borderSweep(page, next, { step: 20, fromFrac: 1.0, toFrac: 0.44 })),
      ...(await borderSweep(page, next, { step: 40, fromFrac: 0.42, toFrac: 0 })),
    ]
    for (const y of ys) {
      await jumpTo(page, y)
      await waitForAnimationsToFinish(page)
      for (const root of roots) {
        for (const x of await measureTextContrast(page, root)) {
          if (x.ratio < x.required) contrast.push(`scrollY ${y}: ${x.ratio}:1 (pide ${x.required}) "${x.text}" ${x.fg} sobre ${x.bg}`)
        }
      }
      for (const c of await findTextUnderSeams(page, roots)) covered.push(`scrollY ${y}: ${c}`)
    }
    const head = (list) => `${list.length} caso(s):\n  ${list.slice(0, 8).join('\n  ')}`
    expect.soft(contrast, `contraste bajo AA: ${head(contrast)}`).toEqual([])
    expect.soft(covered, `texto tapado por la costura: ${head(covered)}`).toEqual([])
  })

  test(`borde ${prev} → ${next}: la cabecera y theme-color toman el tema real que tienen debajo`, async ({ page }) => {
    const mismatches = []
    // Solo la zona donde el borde pasa por debajo de la cabecera (de 160 px a -20 px del tope)
    const top = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top + scrollY, next)
    for (let d = 160; d >= -20; d -= 8) {
      await jumpTo(page, Math.round(top - d))
      const rel = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top, next)
      if (Math.abs(rel - 40) <= 2) continue // empate exacto con el punto de prueba (40 px)
      const s = await surfaceUnderHeader(page)
      if (s.surface !== s.actual || !s.themeColorMatches) {
        mismatches.push(`borde a ${Math.round(rel)} px del tope: debajo ${s.actual} (${s.actualColor}); data-surface=${s.surface}, theme-color=${s.themeColor}`)
      }
    }
    expect(mismatches, `${mismatches.length} posición(es):\n  ${mismatches.join('\n  ')}`).toEqual([])
  })
}
