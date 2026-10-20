// Mapa del sitio según el mockup aprobado (página única). Fuente de verdad para los specs:
// si cambia un id o un nombre accesible en la implementación, se actualiza acá y en PLAN.md.

/** Secciones en orden de lectura: id del ancla y nombre accesible del encabezado. */
export const SECTIONS = [
  { id: 'inicio', heading: 'Ivan Navatta', level: 1 },
  { id: 'perfil', heading: 'Negocio, datos y código.', level: 2 },
  { id: 'proyectos', heading: 'Proyectos', level: 2 },
  { id: 'stack', heading: 'Stack, por capas', level: 2 },
  { id: 'recorrido', heading: 'Recorrido', level: 2 },
  { id: 'contacto', heading: 'Contacto', level: 2 },
]

/** Links de la nav "Secciones" (aria-label del <nav>) y el ancla a la que apuntan. */
export const NAV_LINKS = [
  { name: 'Perfil', href: '#perfil' },
  { name: 'Proyectos', href: '#proyectos' },
  { name: 'Stack', href: '#stack' },
  { name: 'Recorrido', href: '#recorrido' },
  { name: 'Contacto', href: '#contacto' },
]

/** Proyectos (cada uno es un <article> con su h3 y un botón "Ver arquitectura"). */
export const PROJECTS = ['MyTube', 'Sistema de transporte', 'uadeHUB', 'box9']

export const EMAIL = 'ivannavatta@gmail.com'
