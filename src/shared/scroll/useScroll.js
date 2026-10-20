import { useContext } from 'react'
import { ScrollContext } from './scrollContext'

/**
 * { reduced, scrollTo(target, { focusNow }), lockScroll(on), refresh(), getLenis() }
 * - scrollTo acepta '#hash', un elemento o un número; al llegar enfoca el h1/h2 de la sección.
 * - focusNow: enfoca antes de desplazarse (el link tocado desaparece, p. ej. al cerrar un menú).
 * - lockScroll(true|false): bloquea el scroll del documento (menú o diálogo abierto).
 * - refresh(): recalcular pins y disparadores después de cambiar el alto de la página.
 */
export function useScroll() {
  return useContext(ScrollContext)
}
