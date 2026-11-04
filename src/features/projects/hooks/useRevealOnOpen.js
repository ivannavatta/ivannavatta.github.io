import { useEffect } from 'react'
import { useScroll } from '@/shared/scroll'

const GAP = 16 // px de aire entre el bloque y el borde de la pantalla (o la barra fija)
const DURATION = 0.6 // s: un acomodo corto, no un viaje (los links del menú usan 1.4)

/**
 * Cuando `open` pasa a true, si el bloque (`ref`) no se ve entero, la página se desplaza lo
 * justo para mostrarlo (como scrollIntoView({ block: 'nearest' })): si ya se ve, no se mueve.
 * Pensado para mobile y tablet, donde la terminal se abre debajo del texto y puede quedar
 * fuera de pantalla. Al terminar llama a `onRevealed` (p. ej. para darle el foco al input;
 * conviene que sea estable, con useCallback: si cambia, el efecto vuelve a medir).
 *
 * - Con Lenis, se desplaza con Lenis; con movimiento reducido (sin Lenis), salta sin animación.
 * - Arriba deja libre la barra fija (--bar-h).
 * - Con los casos apilados (pin de GSAP) no hace nada: el caso de adelante ya entra entero en
 *   pantalla, y mover el scroll ahí haría entrar el caso siguiente encima.
 */
export function useRevealOnOpen({ ref, open, onRevealed }) {
  const { getLenis } = useScroll()

  useEffect(() => {
    const el = ref.current
    if (!open || !el) return undefined
    // Un cuadro después del commit: con el layout ya resuelto (la figura se oculta, el bloque crece)
    const frame = requestAnimationFrame(() => {
      if (el.closest('.pin-spacer')) return
      const rect = el.getBoundingClientRect()
      // La entrada arranca 12 px más abajo (@starting-style): medir la caja sin ese desplazamiento
      const shift = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42
      const top = rect.top - shift
      const bottom = top + rect.height
      const minTop = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 0) + GAP
      const maxBottom = window.innerHeight - GAP

      let delta = 0
      if (bottom > maxBottom) delta = bottom - maxBottom
      // Más alto que el espacio libre, o por arriba de la pantalla: se alinea el borde de arriba
      if (top - delta < minTop) delta = top - minTop
      if (Math.abs(delta) < 1) return

      const y = window.scrollY + delta
      const lenis = getLenis()
      if (lenis) {
        lenis.resize() // la página acaba de crecer: sin esto Lenis recorta al límite viejo
        lenis.scrollTo(y, { duration: DURATION, onComplete: () => onRevealed?.() })
        return
      }
      window.scrollTo({ top: y, behavior: 'instant' })
      onRevealed?.()
    })
    return () => cancelAnimationFrame(frame)
  }, [open, ref, getLenis, onRevealed])
}
