// Accesibilidad automática con axe-core (WCAG 2.1 A y AA).
// axe no reemplaza las pruebas de teclado y lector de pantalla: detecta alrededor de un tercio de
// los problemas. Las pruebas manuales/semiautomáticas están en keyboard.js y en cada spec.
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

export const WCAG21_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * Corre axe y falla si hay violaciones WCAG 2.1 AA. Adjunta el resultado completo al reporte.
 * @param {import('@playwright/test').Page} page
 * @param {{
 *   include?: string | string[],   // selector(es) a auditar (ej. '#contacto'); por defecto la página
 *   exclude?: string | string[],   // selector(es) a ignorar (ej. 'canvas' decorativo)
 *   disableRules?: string[],       // reglas a apagar con justificación en el test
 *   impacts?: Array<'minor'|'moderate'|'serious'|'critical'>, // impactos que hacen fallar
 *   tags?: string[],
 * }} [opts]
 */
export async function expectNoA11yViolations(page, opts = {}) {
  const {
    include,
    exclude,
    disableRules = [],
    impacts = ['minor', 'moderate', 'serious', 'critical'],
    tags = WCAG21_AA,
  } = opts

  let builder = new AxeBuilder({ page }).withTags(tags)
  for (const sel of [include ?? []].flat()) builder = builder.include(sel)
  for (const sel of [exclude ?? []].flat()) builder = builder.exclude(sel)
  if (disableRules.length) builder = builder.disableRules(disableRules)

  const results = await builder.analyze()

  try {
    await test.info().attach(`axe${include ? `-${[include].flat().join('_').replace(/[^\w-]/g, '')}` : ''}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    })
  } catch {
    // fuera de un test (uso ad hoc): no hay dónde adjuntar
  }

  // Con canvas/SVG detrás del texto, axe no puede medir el contraste y lo deja en "incomplete".
  // Lo anotamos para que no pase inadvertido: en esos casos usar expectReadableContrast (contrast.js).
  const unmeasured = results.incomplete.find((v) => v.id === 'color-contrast')?.nodes.length ?? 0
  if (unmeasured) {
    try {
      test.info().annotations.push({
        type: 'axe sin medir contraste',
        description: `${unmeasured} nodo(s) en ${[include ?? 'la página'].flat().join(', ')}: usar expectReadableContrast`,
      })
    } catch {
      // fuera de un test
    }
  }

  const violations = results.violations.filter((v) => impacts.includes(v.impact ?? 'minor'))
  expect(violations.length, formatViolations(violations)).toBe(0)
  return results
}

/** Mensaje legible: regla, impacto, ayuda y los primeros nodos afectados. */
export function formatViolations(violations) {
  if (!violations.length) return 'Sin violaciones de axe.'
  return (
    `axe encontró ${violations.length} violación(es) WCAG 2.1 AA:\n` +
    violations
      .map((v) => {
        const nodes = v.nodes
          .slice(0, 5)
          .map((n) => `      - ${n.target.join(' ')}${n.failureSummary ? `\n        ${n.failureSummary.split('\n').join('\n        ')}` : ''}`)
          .join('\n')
        const more = v.nodes.length > 5 ? `\n      … y ${v.nodes.length - 5} más` : ''
        return `  [${v.impact}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n${nodes}${more}`
      })
      .join('\n')
  )
}
