import { certifications, thumbnail } from '@/shared/data/certifications'

const HOURS_PER_BLOCK = 10 // cada bloque del IN equivale a unas diez horas de cursada
const THUMB_WIDTH = 480
// Solo miniaturas de la cuenta de Cloudinary de Ivan (la CSP permite img-src solo ahí)
const IMAGE_ORIGIN = 'https://res.cloudinary.com'
const IMAGE_ACCOUNT = '/dvcmgnvwi/'

const byId = Object.fromEntries(certifications.map((c) => [c.id, c]))

/** true solo para https://res.cloudinary.com/dvcmgnvwi/…; una URL mal formada no rompe el módulo. */
function isAllowedImage(url) {
  try {
    const u = new URL(url)
    return u.origin === IMAGE_ORIGIN && u.pathname.startsWith(IMAGE_ACCOUNT)
  } catch {
    return false
  }
}

/** Un curso de certifications. Si el id no existe, el paso no se muestra (null) en vez de romper la página. */
function course(id, { accent = false } = {}) {
  const cert = byId[id]
  if (!cert) return null
  const hours = Number(cert.hours) || 0
  const image = isAllowedImage(cert.image) ? thumbnail(cert.image, THUMB_WIDTH) : null
  return { id, kind: 'course', hours, blocks: Math.round(hours / HOURS_PER_BLOCK), accent, image }
}

/**
 * Los pasos en orden: cuatro cursos (con su columna de bloques y certificado) y la carrera
 * en curso. Los 19 bloques de los cursos son las 19 piezas del IN; la carrera no suma bloques:
 * el hueco dice que está en marcha.
 */
export const STEPS = [
  course('web'),
  course('javascript'),
  course('react', { accent: true }), // Top 10 del curso: el bloque de acento del IN
  course('backend'),
  { id: 'uade', kind: 'now' },
].filter(Boolean)
