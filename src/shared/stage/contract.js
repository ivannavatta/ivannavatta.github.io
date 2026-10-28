/**
 * Contrato entre las secciones y la feature `stage` (escena 3D, trazas y temas por capítulo).
 *
 * Las secciones no importan a stage ni stage a las secciones: las secciones MARCAN el DOM
 * con estos atributos y stage los MIDE. Así cada feature se reemplaza sin tocar a la otra.
 *
 * - Capítulo:  <section {...chapterProps('perfil', 'light')}>  → id, data-chapter, data-theme
 *              Cada sección pinta su fondo y sus colores según data-theme (globals.css); no hay
 *              mezcla global. Entre capítulos de distinto tema stage dibuja una costura de bloques.
 *              El inicio puede sumar data-backdrop="dark": el fondo que aparece detrás del
 *              marco cuando el inicio se encoge. Una región interna con su propio data-theme
 *              (el marco del inicio) cuenta para el tema de la cabecera.
 * - Pose:      un contenedor con {...poseProps(POSES.stack)} y, adentro, cada bloque con
 *              {...blockProps()} (o {...blockProps({ accent: true })} para el bloque de acento).
 *              Los bloques se leen en orden de documento.
 *              Una pose con data-stage-layout="bricks" no tiene bloques: stage arma dos
 *              hileras de ladrillos dentro del rectángulo del contenedor.
 * - Hover:     announceStageHover(POSES.stack, índice | -1) eleva un bloque de la pose.
 * - Layout:    announceStageLayout() cuando una sección mueve sus bloques sin scroll (un panel que
 *              se abre en el flujo): la escena vuelve a medir en el próximo cuadro.
 *
 * Clases que stage y scroll ponen en <html> (para CSS): ver ROOT_CLASS.
 * Tema discreto para la cabecera: <html data-surface="light|dark"> (ver SURFACE_ATTR).
 */

/** Capítulos en orden de página (también son los id de las secciones). */
export const CHAPTERS = ['inicio', 'perfil', 'proyectos', 'stack', 'recorrido', 'contacto']

export const THEMES = { light: 'light', dark: 'dark' }

/** Formas que toma el IN a lo largo de la página. */
export const POSES = {
  hero: 'hero',
  firma: 'firma',
  perfil: 'perfil',
  visor: 'visor',
  stack: 'stack',
  path: 'path',
  contact: 'contact',
}

export const ATTR = {
  chapter: 'data-chapter',
  theme: 'data-theme',
  backdrop: 'data-backdrop',
  pose: 'data-stage-pose',
  layout: 'data-stage-layout',
  block: 'data-stage-block',
  accent: 'data-stage-accent',
}

/**
 * Clases en <html>:
 * - live:    capa de movimiento activa (Lenis + ScrollTrigger, pins y costuras entre capítulos).
 * - reduced: prefers-reduced-motion. Sin Lenis, sin pins, IN estático en el inicio.
 * - gl:      la escena 3D dibuja los bloques; los equivalentes CSS se vuelven transparentes.
 * - no-gl:   sin WebGL; quedan los bloques CSS (fallback plano).
 */
export const ROOT_CLASS = { live: 'live', reduced: 'reduced', gl: 'gl', noGl: 'no-gl' }

/**
 * Señal de estado del movimiento en <html data-motion> (para tests y depuración):
 * - pending: la capa de movimiento está arrancando.
 * - ready:   Lenis, ScrollTrigger y la escena terminaron de inicializar (con o sin WebGL).
 * - reduced: movimiento reducido; la página quedó lista sin Lenis ni pins.
 * - static:  la capa de movimiento falló; la página queda completa y estática.
 */
export const MOTION_ATTR = 'data-motion'
export const MOTION_STATE = { pending: 'pending', ready: 'ready', reduced: 'reduced', static: 'static' }

export function setMotionState(state) {
  document.documentElement.setAttribute(MOTION_ATTR, state)
}

/** Tema discreto (sin mezcla) del capítulo que está bajo la cabecera. */
export const SURFACE_ATTR = 'data-surface'

/** Largo del pin del inicio, en % de la altura de pantalla. Lo usan el inicio y stage. */
export const HERO_PIN = { mobile: 110, desktop: 150 }

export const MOBILE_QUERY = '(max-width: 767px)'

export const STAGE_HOVER_EVENT = 'stage:hover'

export const STAGE_LAYOUT_EVENT = 'stage:layout'

export const selectors = {
  chapters: 'main > section[data-chapter]',
  chapter: (id) => `section[data-chapter="${id}"]`,
  pose: (pose) => `[data-stage-pose="${pose}"]`,
  block: '[data-stage-block]',
  accent: '[data-stage-accent]',
}

export function chapterProps(id, theme, { backdrop } = {}) {
  const props = { id, 'data-chapter': id, 'data-theme': theme }
  if (backdrop) props['data-backdrop'] = backdrop
  return props
}

export function poseProps(pose, { layout } = {}) {
  const props = { 'data-stage-pose': pose }
  if (layout) props['data-stage-layout'] = layout
  return props
}

export function blockProps({ accent = false } = {}) {
  return accent ? { 'data-stage-block': '', 'data-stage-accent': '' } : { 'data-stage-block': '' }
}

export function announceStageHover(pose, index) {
  window.dispatchEvent(new CustomEvent(STAGE_HOVER_EVENT, { detail: { pose, index } }))
}

export function announceStageLayout() {
  window.dispatchEvent(new CustomEvent(STAGE_LAYOUT_EVENT))
}
