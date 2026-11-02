/**
 * Copia Pyodide (Python en WebAssembly) de node_modules/pyodide a public/pyodide/ antes de `dev`
 * y `build`. Lo usa "Probar en vivo" del caso uadeHUB, que corre el main.py real en un Web Worker.
 *
 * Se sirve desde el propio sitio (no desde un CDN) para que la CSP siga siendo `script-src 'self'`
 * y la demo no dependa de terceros. Solo se copian los cinco archivos que hacen falta para correr
 * la biblioteca estándar; el resto del paquete (tipos, mapas, consolas de ejemplo) no se publica.
 * public/pyodide/ está en .gitignore: los archivos salen siempre de la versión fijada en
 * package.json (sin ^), y el script falla si node_modules tiene otra.
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(root, 'node_modules/pyodide')
const DEST = resolve(root, 'public/pyodide')
const FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']

const sha256 = async (file) => createHash('sha256').update(await readFile(file)).digest('hex')
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))

try {
  const pinned = (await readJson(resolve(root, 'package.json'))).dependencies?.pyodide
  if (!pinned || !/^\d+\.\d+\.\d+$/.test(pinned)) {
    throw new Error(`package.json tiene que fijar una versión exacta de pyodide (hoy: ${pinned ?? 'ninguna'})`)
  }
  if (!existsSync(SOURCE)) throw new Error('falta node_modules/pyodide: corré `npm install`')
  const installed = (await readJson(resolve(SOURCE, 'package.json'))).version
  if (installed !== pinned) {
    throw new Error(`node_modules tiene pyodide ${installed} y package.json fija ${pinned}: corré \`npm install\``)
  }

  await mkdir(DEST, { recursive: true })
  let copied = 0
  for (const name of FILES) {
    const from = resolve(SOURCE, name)
    const to = resolve(DEST, name)
    // Si ya está igual, no se vuelve a copiar (son ~13 MB)
    if (existsSync(to) && (await sha256(from)) === (await sha256(to))) continue
    await copyFile(from, to)
    copied++
  }
  console.log(`[pyodide] ${pinned}: ${copied ? `${copied} archivo(s) copiado(s)` : 'ok'}`)
} catch (error) {
  console.error(`[pyodide] ${error.message}`)
  process.exit(1)
}
