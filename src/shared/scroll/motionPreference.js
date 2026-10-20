import { ROOT_CLASS } from '../stage/contract'

/**
 * Movimiento reducido: sale solo de la preferencia del sistema (prefers-reduced-motion).
 * Se decide una vez al cargar, como en el mockup: cambiar de modo en caliente
 * implicaría rearmar la escena y los pins. Con movimiento reducido no hay Lenis,
 * ni pins, ni scrub: el IN queda quieto en el inicio y cada sección fija su tema.
 */
export const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Marca <html> antes del primer render (main.jsx), así el CSS ya sabe el modo. */
export function applyMotionClass() {
  document.documentElement.classList.toggle(ROOT_CLASS.reduced, REDUCED_MOTION)
}
