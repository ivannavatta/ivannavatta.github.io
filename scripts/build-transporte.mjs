/**
 * Compila el TPO "Sistema de transporte" (Java, Programación II) a JavaScript con TeaVM para
 * "Probar en vivo": el resultado, src/features/projects/live/transporte/teavm/classes.js, lo
 * importa live/transporte.worker.js.
 *
 * Uso: npm run transporte [-- <carpeta del TPO>]   (por defecto ../SistemaTransporte)
 *
 * No forma parte de `dev` ni de `build`: necesita un JDK (11 o más nuevo) y el workflow de GitHub
 * Pages no lo tiene. Por eso el JS generado se commitea, como los main.py de uadeHUB y box9. Si
 * cambia el TPO, se vuelve a correr este script y se commitea el classes.js nuevo.
 *
 * Qué hace:
 *   1. Baja los jars de TeaVM (versión fija) de Maven Central a node_modules/.cache/teavm/ y
 *      verifica cada uno contra su SHA-256; si ya están en la caché y coinciden, no se bajan.
 *   2. Compila con javac las fuentes del TPO, sin copiarlas ni cambiarlas, junto con el puente web
 *      (live/transporte/web/: WebMain, WorkerIO y el Scanner que TeaVM no trae).
 *   3. TeaVM traduce el bytecode a un módulo ES minificado. Se le agrega una cabecera con el
 *      repositorio, el commit del TPO y la versión de TeaVM.
 * Las clases compiladas van a un directorio temporal que se borra al terminar.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TPO = resolve(process.argv[2] ?? resolve(root, '../SistemaTransporte'))
const BRIDGE = resolve(root, 'src/features/projects/live/transporte/web')
const OUT = resolve(root, 'src/features/projects/live/transporte/teavm/classes.js')

const TEAVM = '0.12.0'
const CACHE = resolve(root, `node_modules/.cache/teavm/${TEAVM}`)
const MAVEN = 'https://repo1.maven.org/maven2'

/** Lo que necesita la CLI de TeaVM 0.12.0 para compilar a JS (grupo, artefacto, versión, SHA-256). */
const T = (artifact, sha256) => ['org.teavm', artifact, TEAVM, sha256]
const JARS = [
  T('teavm-cli', '403a6b8ff87fd9fce7d5cf0294674ab9d852d9b15cd45d580152dfd0abb8409c'),
  T('teavm-tooling', '265d01c707d1c4f226785b0b34aee4b703e72c6654e4bf9bc8e510f88033f12a'),
  T('teavm-core', 'a49d14f776b2e76f448b1755e5fa271bc048c818083e1f46061a4b299cc811aa'),
  T('teavm-classlib', 'ddf0c165b29da706880778f63098fe255cc4c1b859a548a7ac7484bb38e13c78'),
  T('teavm-interop', '2443b6b5ebce2519af3d8ea9c934c6f5e4d8376174afcbd31bfda9e7e885481d'),
  T('teavm-jso', '9c312885e29079d0750e0005318e5d9440ae2d26235b9a859fabf86dffe13858'),
  T('teavm-jso-apis', 'efbb6cbe3d2d12ec0872375ebb11a2c2e09a8d07749f2dec3f163c75e4bc985d'),
  T('teavm-jso-impl', '70486d0a3a3733ec018b1a9563784db15cc8b3fa400c0d7a184642fc2efd45e9'),
  T('teavm-platform', '58440126cce3fe998dadb1786eb11ced3ab6c72828f3374ad7abed2b1bde2ee5'),
  T('teavm-metaprogramming-api', 'fdb3c6db916d42c513f0cabfd1ada157cf36866ba1d9fd87a1ff716a1b2401eb'),
  T('teavm-metaprogramming-impl', '7c7569943138e75a4756bd3e15eae0cabbeac788dbf59ac85e87bf42e14b88a4'),
  T('teavm-relocated-libs-asm', '3609e046f2de801045109df9aae8ceb7a7241ce84f05cfe54de892d090572ba8'),
  T('teavm-relocated-libs-asm-commons', '4307ca22003a3276cfa087b336b7c37f0f3c45468b179b1b45babfc8ace870e0'),
  T('teavm-relocated-libs-asm-util', '93ac8c34d49c9e10f1b5087e277d0449f0123c69ecff3ccc7d7575387a486750'),
  T('teavm-relocated-libs-asm-tree', 'ffdf4593a7ae39aa12bbc7565de415c6aa12edeb93d1b967b8f5c558ba9fd651'),
  T('teavm-relocated-libs-asm-analysis', '1b72de5be4c46bf5a043b2a5ee90d83fee8fd5cb5736d9c5a79fe648f187e7f1'),
  T('teavm-relocated-libs-hppc', 'a66d35e29c30f07b819a0eeaeb714343d04b615a9b41a99dbbe3585563186ff6'),
  T('teavm-relocated-libs-rhino', '2ddf01a6b8f5623171737150a2b92a43e13c0ebc7bddd958f64c0a7426e4f6be'),
  T('teavm-relocated-libs-commons-io', '0e04b244fac7b79f2317626164e8de4687ebb20047dd284eec64cae21e67cb23'),
  T('teavm-relocated-libs-commons-cli', '0093b7ecbb880b6afaee940ec3e801031e950497321ccd14fbd999881b5cc7cc'),
  ['commons-io', 'commons-io', '2.18.0', 'f3ca0f8d63c40e23a56d54101c60d5edee136b42d84bfb85bc7963093109cf8b'],
  ['com.jcraft', 'jzlib', '1.1.3', '89b1360f407381bf61fde411019d8cbd009ebb10cff715f3669017a031027560'],
  ['joda-time', 'joda-time', '2.12.2', '8d4d807adc8e92a83913d9ccd61e634b4907c78d88f3016d06b3b3d2b4795a02'],
  ['commons-cli', 'commons-cli', '1.9.0', 'd3d530d0f28fd0fbbffe2b0b338f70e8cb96f1605579e2e3abd4db29cac24e69'],
]

const log = (msg) => console.log(`[transporte] ${msg}`)
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`

/** Corre un comando y devuelve su salida; si falla, el error lleva lo que imprimió. */
function run(cmd, args, { cwd } = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (r.error) throw r.error
  if (r.status !== 0) {
    const output = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim()
    throw new Error(`${cmd} terminó con código ${r.status}${output ? `:\n${output}` : ''}`)
  }
  return `${r.stdout ?? ''}${r.stderr ?? ''}`.trim()
}

/** java y javac en el PATH, de un JDK 11 o más nuevo (--release 11 y la CLI de TeaVM lo piden). */
function checkJdk() {
  let version
  try {
    version = run('javac', ['-version'])
    run('java', ['-version'])
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('no se encontró java/javac: instalá un JDK 11 o más nuevo y sumalo al PATH', { cause: error })
    }
    throw error
  }
  const major = Number(/javac (\d+)/.exec(version)?.[1])
  if (!(major >= 11)) throw new Error(`hace falta un JDK 11 o más nuevo (hay: ${version})`)
  return version
}

/** Baja un jar a la caché (o usa el que ya está) y verifica su SHA-256. */
async function fetchJar([group, artifact, version, expected]) {
  const name = `${artifact}-${version}.jar`
  const file = join(CACHE, name)
  if (existsSync(file) && sha256(await readFile(file)) === expected) return { file, downloaded: false }

  const url = `${MAVEN}/${group.replaceAll('.', '/')}/${artifact}/${version}/${name}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`no se pudo bajar ${url} (HTTP ${res.status})`)
  const buf = Buffer.from(await res.arrayBuffer())
  const actual = sha256(buf)
  if (actual !== expected) throw new Error(`${name}: el SHA-256 no coincide (esperado ${expected}, bajado ${actual})`)
  await writeFile(file, buf)
  return { file, downloaded: true }
}

async function javaFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  return entries.filter((e) => e.isFile() && e.name.endsWith('.java')).map((e) => join(e.parentPath, e.name))
}

/** "repo@commit" del TPO para la cabecera; avisa si hay cambios sin commitear en src/. */
function tpoVersion() {
  try {
    const commit = run('git', ['rev-parse', '--short', 'HEAD'], { cwd: TPO })
    const origin = run('git', ['remote', 'get-url', 'origin'], { cwd: TPO })
    const repo = origin.replace(/^git@github\.com:/, 'github.com/').replace(/^https?:\/\//, '').replace(/\.git$/, '')
    const dirty = run('git', ['status', '--porcelain', '--', 'src'], { cwd: TPO }) !== ''
    if (dirty) log('ojo: el TPO tiene cambios sin commitear en src/; la cabecera lo indica')
    return `${repo} @ ${commit}${dirty ? ' (con cambios sin commitear)' : ''}`
  } catch {
    log('ojo: la carpeta del TPO no es un repositorio git con origin; la cabecera no lleva commit')
    return 'repositorio local (sin git)'
  }
}

let work = null
try {
  if (!existsSync(join(TPO, 'src/Main.java'))) {
    throw new Error(`no encuentro ${join(TPO, 'src/Main.java')}: pasá la carpeta del TPO (npm run transporte -- <carpeta>)`)
  }
  const jdk = checkJdk()
  log(`TPO: ${TPO} · ${jdk}`)

  await mkdir(CACHE, { recursive: true })
  const jars = await Promise.all(JARS.map(fetchJar))
  const downloaded = jars.filter((j) => j.downloaded).length
  log(`TeaVM ${TEAVM}: ${jars.length} jars verificados${downloaded ? ` (${downloaded} bajado(s))` : ' (caché)'}`)
  const jar = (artifact) => jars[JARS.findIndex(([, a]) => a === artifact)].file

  work = await mkdtemp(join(tmpdir(), 'teavm-transporte-'))
  const classes = join(work, 'classes')
  const out = join(work, 'out')

  // Lista de fuentes en un archivo (@argfile): en Windows la línea de comandos tiene un tope de largo
  const sources = [...(await javaFiles(join(TPO, 'src'))), ...(await javaFiles(BRIDGE))]
  const argfile = join(work, 'sources.txt')
  await writeFile(argfile, sources.map((f) => `"${f.replaceAll('\\', '/')}"`).join('\n'))
  run('javac', [
    '--release', '11',
    '-encoding', 'UTF-8',
    '-nowarn',
    '-cp', [jar('teavm-interop'), jar('teavm-jso')].join(delimiter),
    '-d', classes,
    `@${argfile}`,
  ])
  log(`javac: ${sources.length} archivos compilados`)

  run('java', [
    '-cp', jars.map((j) => j.file).join(delimiter),
    'org.teavm.cli.TeaVMRunner',
    '-t', 'js',
    '--js-module-type', 'es2015',
    '-m',
    '-O', '2',
    '-p', classes,
    '-d', out,
    'WebMain',
  ])
  const generated = join(out, 'classes.js')
  if (!existsSync(generated)) throw new Error('TeaVM terminó sin generar classes.js')
  const js = await readFile(generated, 'utf8')
  if (!/export\s*\{[^}]*\bas main\b/.test(js)) throw new Error('el JS generado no exporta main')

  const header = [
    '// Generado por scripts/build-transporte.mjs: no editar a mano.',
    `// Fuente: ${tpoVersion()} (src/, sin cambios) + live/transporte/web/.`,
    `// Compilado con javac --release 11 y TeaVM ${TEAVM} (módulo ES, minificado).`,
    '',
  ].join('\n')
  const result = header + js.replace(/\s*$/, '\n')
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, result)
  log(`${relative(root, OUT)}: ${kb(Buffer.byteLength(result))} (${kb(gzipSync(result).length)} con gzip)`)
} catch (error) {
  console.error(`[transporte] ${error.message}`)
  process.exitCode = 1
} finally {
  if (work) await rm(work, { recursive: true, force: true })
}
if (process.exitCode) process.exit(1)
