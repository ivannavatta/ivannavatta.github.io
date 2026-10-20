// El CV público no tiene que exponer datos personales sensibles (por ejemplo, un teléfono).
// En vez de extraer el texto del PDF (no hay parser en el proyecto), fijamos el SHA-256 de la
// versión revisada por seguridad: cualquier cambio en public/cv.pdf hace fallar este test y obliga
// a revisar el nuevo archivo a mano y actualizar el hash a propósito.
//
// Para actualizarlo después de revisar el PDF nuevo:
//   PowerShell: (Get-FileHash public/cv.pdf -Algorithm SHA256).Hash.ToLower()
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { test, expect } from './helpers/index.js'

// Versión revisada (sin teléfono), commit 953cac9.
const CV_SHA256 = 'ada8fc0168260aaadaf205d2c51a3c6e8ca03a173aefecef679e6d1199771d6e'
const CV_PATH = fileURLToPath(new URL('../../public/cv.pdf', import.meta.url))

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

// No depende del viewport: corre una sola vez, en desktop.
test.describe('cv.pdf', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'desktop', 'Solo en desktop')
  })

  test('public/cv.pdf es la versión revisada (sin teléfono)', async () => {
    const hash = sha256(await readFile(CV_PATH))
    expect(
      hash,
      'public/cv.pdf cambió. Revisá que el PDF nuevo no tenga teléfono ni otros datos sensibles y, si está bien, actualizá CV_SHA256.',
    ).toBe(CV_SHA256)
  })

  test('el sitio sirve exactamente ese PDF', async ({ request }) => {
    const res = await request.get('/cv.pdf')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('application/pdf')
    const served = sha256(await res.body())
    const onDisk = sha256(await readFile(CV_PATH))
    expect(served, 'El /cv.pdf servido no es el de public/ (¿build viejo?)').toBe(onDisk)
  })
})
