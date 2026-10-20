import { useEffect } from 'react'
import { ScrollTrigger, useScroll } from '@/shared/scroll'

/**
 * La declaración se enciende palabra por palabra con el scroll: solo cambia el color
 * (de --soft a --ink, ver .word en About.module.css). Las palabras ya están en el DOM con su
 * texto completo, así que los lectores de pantalla leen la oración entera desde el principio.
 * Con movimiento reducido no hay disparador y todo queda en tinta.
 */
export function useWordReveal(ref, onClass) {
  const { reduced } = useScroll()

  useEffect(() => {
    const el = ref.current
    if (reduced || !el) return undefined
    const words = Array.from(el.children)
    let lit = -1
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      end: 'bottom 45%',
      onUpdate: (self) => {
        const n = Math.round(self.progress * words.length)
        if (n === lit) return
        lit = n
        words.forEach((w, i) => w.classList.toggle(onClass, i < n))
      },
    })
    return () => {
      st.kill()
      words.forEach((w) => w.classList.remove(onClass))
    }
  }, [ref, onClass, reduced])
}
