// Geometría de los capítulos que comparten la costura, el tema de la cabecera y las trazas.
import { ROOT_CLASS, THEMES } from '@/shared/stage'

/** Alto de la costura entre capítulos: el paso de la grilla de las trazas (los bloques caen sobre ella). */
export const SEAM_MODULE = 48

const isLive = () => document.documentElement.classList.contains(ROOT_CLASS.live)

/**
 * Tema efectivo de una región: con escena viva, una sección con data-backdrop muestra ese
 * fondo detrás de su contenido (el inicio, oscuro detrás del marco que se encoge).
 */
export function effectiveTheme(el) {
  return (isLive() && el.dataset.backdrop) || el.dataset.theme || THEMES.light
}

