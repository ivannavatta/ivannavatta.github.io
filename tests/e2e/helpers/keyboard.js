// Ayudas para probar navegación por teclado y foco visible.
import { expect } from '@playwright/test'

/**
 * Aprieta Tab (o Shift+Tab) hasta que `locator` tenga el foco. Falla si no llega en `max` pasos.
 * Devuelve cuántas teclas hicieron falta.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} locator
 * @param {{ max?: number, reverse?: boolean }} [opts]
 */
export async function tabUntilFocused(page, locator, { max = 60, reverse = false } = {}) {
  const key = reverse ? 'Shift+Tab' : 'Tab'
  for (let i = 1; i <= max; i++) {
    await page.keyboard.press(key)
    if (await locator.evaluate((el) => el === document.activeElement || el.contains(document.activeElement))) return i
  }
  throw new Error(`El foco no llegó al elemento después de ${max} ${key}.`)
}

/**
 * Lista (nombre accesible aproximado) de los elementos que reciben foco con Tab, en orden.
 * Sirve para comparar el orden de tabulación con el orden visual.
 */
export async function tabOrder(page, { max = 80 } = {}) {
  const seen = []
  await page.locator('body').evaluate(() => document.activeElement?.blur())
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const info = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      const name = el.getAttribute('aria-label') || el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) || el.getAttribute('name') || ''
      return `${el.tagName.toLowerCase()}:${name}`
    })
    if (!info || seen.includes(info)) break
    seen.push(info)
  }
  return seen
}

/**
 * Falla si el elemento con foco no muestra un indicador visible (outline o box-shadow).
 * Chequeo aproximado de WCAG 2.4.7; no mide contraste del anillo.
 * @param {import('@playwright/test').Locator} locator
 */
export async function expectVisibleFocus(locator) {
  await expect(locator).toBeFocused()
  const style = await locator.evaluate((el) => {
    const s = getComputedStyle(el)
    return {
      outlineStyle: s.outlineStyle,
      outlineWidth: parseFloat(s.outlineWidth) || 0,
      boxShadow: s.boxShadow,
      focusVisible: el.matches(':focus-visible'),
    }
  })
  const hasOutline = style.outlineStyle !== 'none' && style.outlineWidth >= 1
  const hasShadow = style.boxShadow && style.boxShadow !== 'none'
  expect(
    hasOutline || hasShadow,
    `Sin indicador de foco visible (outline ${style.outlineStyle} ${style.outlineWidth}px, box-shadow ${style.boxShadow}, :focus-visible ${style.focusVisible})`,
  ).toBe(true)
}

/**
 * Da foco a `locator` en modalidad teclado (para que matchee :focus-visible): primero un Tab real
 * (el navegador pasa a modalidad teclado) y después el foco programático, que la conserva.
 * Útil cuando el componente reacciona solo a foco de teclado (p. ej. el salto de los casos apilados).
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} locator
 */
export async function keyboardFocus(page, locator) {
  await page.keyboard.press('Tab')
  await locator.focus()
  await expect(locator).toBeFocused()
  return locator.evaluate((el) => el.matches(':focus-visible'))
}
