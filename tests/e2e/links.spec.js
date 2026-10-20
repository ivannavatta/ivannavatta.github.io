// Política de links y botones de toda la página (cubre Button, TextLink, la nav y lo que se sume).
// Revisa el DOM completo, incluidos los elementos ocultos (por ejemplo, el panel del menú mobile),
// así que cada componente nuevo queda alcanzado sin escribir un test propio.
//
// - Externos (http/https): https, target="_blank", rel con noopener y noreferrer, y el nombre
//   accesible avisa "(se abre en otra pestaña)".
// - Internos (#id): el id existe en la página.
// - Descargas: rutas propias (mismo origen), sin target.
// - Sin href vacío ni "javascript:". Todo <button> declara su type.
import { test, expect, waitForAppReady } from './helpers/index.js'

test.beforeEach(async ({ page }) => {
  const project = test.info().project.name
  test.skip(project !== 'desktop' && project !== 'mobile', 'El DOM es el mismo en todos los tamaños')
  await page.goto('/')
  await waitForAppReady(page)
})

/** Recorre los <a> y <button> de la página y devuelve las infracciones. */
async function audit(page) {
  return page.evaluate(() => {
    const out = { external: [], internal: [], download: [], href: [], buttons: [], total: 0 }
    const label = (el) => (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim()
    const where = (el) => `${label(el).slice(0, 40) || '(sin texto)'} → ${el.getAttribute('href') ?? ''}`

    for (const a of document.querySelectorAll('a')) {
      out.total++
      const href = a.getAttribute('href')
      if (href === null || href.trim() === '' || /^javascript:/i.test(href)) {
        out.href.push(where(a))
        continue
      }
      if (/^https?:/i.test(href)) {
        const rel = (a.getAttribute('rel') ?? '').split(/\s+/)
        const problems = []
        if (!href.startsWith('https://')) problems.push('no es https')
        if (a.getAttribute('target') !== '_blank') problems.push('sin target="_blank"')
        if (!rel.includes('noopener')) problems.push('sin rel noopener')
        if (!rel.includes('noreferrer')) problems.push('sin rel noreferrer')
        if (!/otra pestaña/i.test(label(a))) problems.push('el nombre no avisa "(se abre en otra pestaña)"')
        if (problems.length) out.external.push(`${where(a)}: ${problems.join(', ')}`)
      } else if (href.startsWith('#')) {
        if (href.length > 1 && !document.getElementById(href.slice(1))) out.internal.push(`${where(a)}: no existe el id`)
      }
      if (a.hasAttribute('download')) {
        const url = new URL(href, location.href)
        if (url.origin !== location.origin) out.download.push(`${where(a)}: descarga de otro origen`)
        if (a.hasAttribute('target')) out.download.push(`${where(a)}: download con target`)
      }
      if (a.getAttribute('target') === '_blank' && !/^https:/i.test(href)) out.external.push(`${where(a)}: target _blank en un link no externo`)
    }
    for (const b of document.querySelectorAll('button')) {
      if (!b.hasAttribute('type')) out.buttons.push(`${label(b).slice(0, 40)}: sin type`)
    }
    return out
  })
}

test('links externos seguros y anunciados', async ({ page }) => {
  const r = await audit(page)
  expect(r.total, 'no se encontraron links').toBeGreaterThan(0)
  expect(r.external).toEqual([])
})

test('links internos con destino existente y sin href vacío ni javascript:', async ({ page }) => {
  const r = await audit(page)
  expect(r.internal).toEqual([])
  expect(r.href).toEqual([])
})

test('descargas de mismo origen y sin target', async ({ page }) => {
  const r = await audit(page)
  expect(r.download).toEqual([])
  await expect(page.locator('a[download]').first()).toBeAttached()
})

test('todo <button> declara su type', async ({ page }) => {
  const r = await audit(page)
  expect(r.buttons).toEqual([])
})
