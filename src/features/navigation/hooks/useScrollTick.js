import { useEffect, useLayoutEffect, useRef } from 'react'
import { ScrollTrigger, gsap, useScroll } from '@/shared/scroll'

/**
 * Llama a onTick(scrollY, force) cuando cambia el scroll.
 * Con movimiento completo corre en el ticker de GSAP, después de Lenis (mismo cuadro que la escena);
 * con movimiento reducido, en el evento scroll nativo.
 * force = true después de un recálculo de layout (pins, resize) aunque el scroll no haya cambiado.
 */
export function useScrollTick(onTick) {
  const { reduced } = useScroll()
  const callback = useRef(onTick)
  useLayoutEffect(() => {
    callback.current = onTick
  })

  useEffect(() => {
    let lastY = -1
    let force = true
    const run = () => {
      const y = window.scrollY
      if (y === lastY && !force) return
      const forced = force
      lastY = y
      force = false
      callback.current(y, forced)
    }
    const invalidate = () => {
      force = true
      if (reduced) run()
    }
    run()
    window.addEventListener('resize', invalidate)
    if (reduced) {
      window.addEventListener('scroll', run, { passive: true })
      return () => {
        window.removeEventListener('scroll', run)
        window.removeEventListener('resize', invalidate)
      }
    }
    ScrollTrigger.addEventListener('refresh', invalidate)
    gsap.ticker.add(run)
    return () => {
      gsap.ticker.remove(run)
      ScrollTrigger.removeEventListener('refresh', invalidate)
      window.removeEventListener('resize', invalidate)
    }
  }, [reduced])
}
