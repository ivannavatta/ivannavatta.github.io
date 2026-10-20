// Mapa del sitio según el mockup aprobado y la implementación (página única). Fuente de verdad
// para los specs: si cambia un id o un nombre accesible, se actualiza acá y en PLAN.md.
// Textos de la nav: src/features/navigation/i18n/es.js.

/** Secciones en orden de lectura: id del ancla y nombre accesible del encabezado. */
export const SECTIONS = [
  { id: 'inicio', heading: 'Ivan Navatta', level: 1 },
  { id: 'perfil', heading: 'Negocio, datos y código.', level: 2 },
  { id: 'proyectos', heading: 'Proyectos', level: 2 },
  { id: 'stack', heading: 'Stack, por capas', level: 2 },
  { id: 'recorrido', heading: 'Recorrido', level: 2 },
  { id: 'contacto', heading: 'Contacto', level: 2 },
]

/** Links de la nav "Secciones" y la sección a la que apuntan (id = capítulo). */
export const NAV_LINKS = [
  { name: 'Perfil', href: '#perfil', id: 'perfil' },
  { name: 'Proyectos', href: '#proyectos', id: 'proyectos' },
  { name: 'Stack', href: '#stack', id: 'stack' },
  { name: 'Recorrido', href: '#recorrido', id: 'recorrido' },
  { name: 'Contacto', href: '#contacto', id: 'contacto' },
]

/** Nombres accesibles de la cabecera. */
export const NAV = {
  label: 'Secciones',
  home: 'IN, volver al inicio',
  openMenu: 'Abrir menú',
  closeMenu: 'Cerrar menú',
  channelsLabel: 'Canales de contacto',
  /** Canales del panel mobile (el nombre accesible empieza con el texto visible). */
  channels: [/^Email$/, /^LinkedIn/, /^GitHub/, /^CV/],
}

/** Umbrales de useNavVisibility (src/features/navigation/hooks/useNavVisibility.js). */
export const NAV_THRESHOLDS = { top: 64, hide: 40, show: 24 }

/** Ancho máximo del layout mobile (MOBILE_QUERY = '(max-width: 767px)'). */
export const MOBILE_MAX = 767

/** Proyectos (cada uno es un <article> con su h3 y un botón "Ver arquitectura"). */
export const PROJECTS = ['MyTube', 'Sistema de transporte', 'uadeHUB', 'box9']

export const EMAIL = 'ivannavatta@gmail.com'
