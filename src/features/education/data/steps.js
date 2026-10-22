import { certifications, thumbnail } from '@/shared/data/certifications'

const HOURS_PER_BLOCK = 10 // cada bloque del IN equivale a unas diez horas de cursada
const THUMB_WIDTH = 480
// Solo miniaturas de la cuenta de Cloudinary de Ivan (la CSP permite img-src solo ahí)
const ALLOWED_IMAGES = 'https://res.cloudinary.com/dvcmgnvwi/'

const byId = Object.fromEntries(certifications.map((c) => [c.id, c]))

function course(id, { accent = false } = {}) {
  const cert = byId[id]
  const image = cert.image.startsWith(ALLOWED_IMAGES) ? thumbnail(cert.image, THUMB_WIDTH) : null
  return { id, kind: 'course', hours: cert.hours, blocks: Math.round(cert.hours / HOURS_PER_BLOCK), accent, image }
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
]
