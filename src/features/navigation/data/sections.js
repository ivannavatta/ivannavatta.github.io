import { profile } from '@/shared/data/profile'

/** Secciones de la nav, en orden de página. La última es el bloque de destino del circuito. */
export const NAV_SECTIONS = [
  { id: 'perfil' },
  { id: 'proyectos' },
  { id: 'stack' },
  { id: 'recorrido' },
  { id: 'contacto', cta: true },
]

/** Canales del panel mobile. Solo URLs constantes (https:, mailto: o rutas propias). */
export const NAV_CHANNELS = [
  { id: 'email', href: `mailto:${profile.contact.email}` },
  { id: 'linkedin', href: profile.contact.linkedin, external: true },
  { id: 'github', href: profile.contact.github, external: true },
  { id: 'cv', href: profile.cvUrl, download: true },
]
