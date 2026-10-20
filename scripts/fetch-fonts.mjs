/**
 * Descarga General Sans desde Fontshare antes de `dev` y `build`.
 *
 * La licencia ITF Free Font (public/fonts/general-sans/LICENSE-FFL.txt) permite servir la fuente
 * desde el sitio, pero no distribuirla en un repositorio público. Por eso el .woff2 está en
 * .gitignore y se baja acá. Se verifica contra un SHA-256 fijo, así el build falla si el archivo
 * del proveedor cambia en vez de publicar algo distinto sin aviso.
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const FONTS = [
  {
    name: 'General Sans (variable, 200–700)',
    url: 'https://cdn.fontshare.com/wf/LHQJ5KSAL7VGAEIDSTEXCCOIUKFLT2I6/GW57XUEG4ZBVMLZZTQZTGYPROITRRQ5W/JA3IZUEMJ2J6WWT2OQVJOAWDXO3YL4YG.woff2',
    sha256: '49d3fbd2f1bcc9850d8d939cabf107d6ade508ce08419fca466b06879e4a0a8e',
    dest: 'public/fonts/general-sans/GeneralSans-Variable.woff2',
  },
]

const TIMEOUT_MS = 30_000
const MAX_BYTES = 1024 * 1024

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

async function ensure({ name, url, sha256: expected, dest }) {
  const file = resolve(root, dest)

  // Si ya está y coincide, no hace falta red (permite trabajar offline)
  if (existsSync(file) && sha256(await readFile(file)) === expected) return 'ok'

  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) throw new Error(`${name}: la descarga respondió ${response.status}`)
  if (Number(response.headers.get('content-length')) > MAX_BYTES) {
    throw new Error(`${name}: el archivo supera ${MAX_BYTES} bytes`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > MAX_BYTES) throw new Error(`${name}: el archivo supera ${MAX_BYTES} bytes`)
  const actual = sha256(buffer)
  if (actual !== expected) {
    throw new Error(`${name}: el SHA-256 no coincide (esperado ${expected}, recibido ${actual})`)
  }

  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, buffer)
  return 'descargada'
}

try {
  for (const font of FONTS) {
    const status = await ensure(font)
    console.log(`[fonts] ${font.name}: ${status}`)
  }
} catch (error) {
  console.error(`[fonts] ${error.message}`)
  process.exit(1)
}
