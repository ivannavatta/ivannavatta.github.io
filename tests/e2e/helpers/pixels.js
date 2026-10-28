// Color real en pantalla (lo que pinta el canvas WebGL, que el DOM no expone).
//
// Por qué existe: con escena viva, las teclas del stack son botones transparentes y el bloque que
// se ve detrás lo dibuja el canvas. Ni getComputedStyle ni axe saben de qué color es: hay que
// mirar los píxeles. Se saca una captura del recorte y se decodifica DENTRO de la página con
// createImageBitmap (un Blob no pasa por img-src, así que no choca con la CSP).

/**
 * Color dominante (moda, cuantizada en pasos de 8) dentro de `box`, en píxeles CSS.
 * Sirve para leer el color de fondo de un bloque aunque tenga texto encima (el texto ocupa
 * mucho menos área que la cara del bloque).
 * @param {import('@playwright/test').Page} page
 * @param {{ x: number, y: number, width: number, height: number }} box coordenadas del viewport
 * @param {{ inset?: number }} [opts] píxeles que se recortan de cada borde (sombras, aristas)
 * @returns {Promise<{ r: number, g: number, b: number, share: number }>} share: fracción del área
 */
export async function dominantColor(page, box, { inset = 4 } = {}) {
  const clip = {
    x: Math.max(0, box.x + inset),
    y: Math.max(0, box.y + inset),
    width: Math.max(1, box.width - inset * 2),
    height: Math.max(1, box.height - inset * 2),
  }
  const png = await page.screenshot({ clip, scale: 'css', animations: 'allow', caret: 'initial' })
  return page.evaluate(async (b64) => {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
    const canvas = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bmp, 0, 0)
    const { data } = ctx.getImageData(0, 0, bmp.width, bmp.height)
    const buckets = new Map()
    for (let i = 0; i < data.length; i += 4) {
      const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3)
      const acc = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
      acc.n++
      acc.r += data[i]
      acc.g += data[i + 1]
      acc.b += data[i + 2]
      buckets.set(key, acc)
    }
    let best = null
    for (const acc of buckets.values()) if (!best || acc.n > best.n) best = acc
    const total = data.length / 4
    return {
      r: Math.round(best.r / best.n),
      g: Math.round(best.g / best.n),
      b: Math.round(best.b / best.n),
      share: Math.round((best.n / total) * 100) / 100,
    }
  }, png.toString('base64'))
}

/**
 * Igual que dominantColor pero para varias cajas con UNA sola captura (del rectángulo que las
 * envuelve): mucho más rápido para sondear que una captura por caja.
 * @param {import('@playwright/test').Page} page
 * @param {Array<{ x: number, y: number, width: number, height: number }>} boxes coordenadas del viewport
 * @param {{ inset?: number }} [opts]
 * @returns {Promise<Array<{ r: number, g: number, b: number, share: number }>>}
 */
export async function dominantColors(page, boxes, { inset = 4 } = {}) {
  if (!boxes.length) return []
  // Una captura del rectángulo que envuelve todas las cajas (cuanto más chica, más rápida)
  const vp = page.viewportSize()
  const x0 = Math.max(0, Math.floor(Math.min(...boxes.map((b) => b.x))))
  const y0 = Math.max(0, Math.floor(Math.min(...boxes.map((b) => b.y))))
  const x1 = Math.min(vp.width, Math.ceil(Math.max(...boxes.map((b) => b.x + b.width))))
  const y1 = Math.min(vp.height, Math.ceil(Math.max(...boxes.map((b) => b.y + b.height))))
  const clip = { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) }
  const png = await page.screenshot({ clip, scale: 'css', animations: 'allow', caret: 'initial' })
  const local = boxes.map((b) => ({ x: b.x - x0, y: b.y - y0, width: b.width, height: b.height }))
  return page.evaluate(
    async ({ b64, boxes, inset }) => {
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
      const canvas = new OffscreenCanvas(bmp.width, bmp.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(bmp, 0, 0)
      return boxes.map((box) => {
        const x = Math.max(0, Math.round(box.x + inset))
        const y = Math.max(0, Math.round(box.y + inset))
        const w = Math.max(1, Math.min(bmp.width - x, Math.round(box.width - inset * 2)))
        const h = Math.max(1, Math.min(bmp.height - y, Math.round(box.height - inset * 2)))
        const { data } = ctx.getImageData(x, y, w, h)
        const buckets = new Map()
        for (let i = 0; i < data.length; i += 4) {
          const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3)
          const acc = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
          acc.n++
          acc.r += data[i]
          acc.g += data[i + 1]
          acc.b += data[i + 2]
          buckets.set(key, acc)
        }
        let best = null
        for (const acc of buckets.values()) if (!best || acc.n > best.n) best = acc
        return {
          r: Math.round(best.r / best.n),
          g: Math.round(best.g / best.n),
          b: Math.round(best.b / best.n),
          share: Math.round((best.n / (data.length / 4)) * 100) / 100,
        }
      })
    },
    { b64: png.toString('base64'), boxes: local, inset },
  )
}

/** Distancia euclídea entre dos colores RGB (0–441). */
export function colorDistance(a, b) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b)
}

/** Relación de contraste WCAG entre dos colores RGB opacos. */
export function contrastRatio(a, b) {
  const lum = ({ r, g, b: bl }) => {
    const f = (v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl)
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** "rgb(…)" o "rgba(…)" → { r, g, b, a }. */
export function parseRgb(css) {
  const m = css.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]
  return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }
}
