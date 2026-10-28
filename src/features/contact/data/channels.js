import { profile } from '@/shared/data/profile'

/**
 * Canales de contacto, en orden. Solo URLs constantes (mailto:, https: o rutas propias).
 * El CV es /cv.pdf (versión sin teléfono).
 */
export const CHANNELS = [
  { id: 'email', href: `mailto:${profile.contact.email}`, value: profile.contact.email, copy: profile.contact.email },
  { id: 'linkedin', href: profile.contact.linkedin, value: profile.fullName, external: true },
  { id: 'github', href: profile.contact.github, value: profile.contact.githubUser, external: true },
  { id: 'cv', href: profile.cvUrl, download: true },
]

export const EMAIL = profile.contact.email
