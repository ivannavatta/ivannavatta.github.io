import { useEffect } from 'react'
import { ScrollTrigger, gsap, useScroll } from '@/shared/scroll'
import { HERO_PIN, MOBILE_QUERY } from '@/shared/stage'

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a, b, t) => a + (b - a) * t
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const MIN_SCALE = { mobile: 0.6, desktop: 0.44 }
const ROW_TRAVEL = 28 // % que recorre cada fila durante el pin

/**
 * Pin + scrub del inicio: el marco se encoge (la primera mitad del pin) y detrás cruzan las
 * dos filas en sentidos opuestos. El fondo oscuro y la firma del IN los pone la escena
 * (stage) con el mismo largo de pin (HERO_PIN). Con movimiento reducido no hay pin.
 * Solo transform: nada de layout por cuadro.
 */
export function useHeroPin({ sectionRef, pinRef, frameRef, rowARef, rowBRef }) {
  const { reduced } = useScroll()

  useEffect(() => {
    if (reduced) return undefined
    const mm = gsap.matchMedia()
    mm.add({ mobile: MOBILE_QUERY, desktop: '(min-width: 768px)' }, (ctx) => {
      const { mobile } = ctx.conditions
      const minScale = mobile ? MIN_SCALE.mobile : MIN_SCALE.desktop
      const frame = frameRef.current
      const rowA = rowARef.current
      const rowB = rowBRef.current
      rowB.style.transform = `translate3d(-${ROW_TRAVEL}%,0,0)`
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: `+=${mobile ? HERO_PIN.mobile : HERO_PIN.desktop}%`,
        pin: pinRef.current,
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress
          const s = easeInOut(clamp01(p / 0.5))
          frame.style.transform = `scale(${lerp(1, minScale, s).toFixed(4)})`
          rowA.style.transform = `translate3d(${(-p * ROW_TRAVEL).toFixed(3)}%,0,0)`
          rowB.style.transform = `translate3d(${(-ROW_TRAVEL + p * ROW_TRAVEL).toFixed(3)}%,0,0)`
        },
      })
      return () => {
        st.kill()
        frame.style.transform = ''
        rowA.style.transform = ''
        rowB.style.transform = ''
      }
    })
    return () => mm.revert()
  }, [reduced, sectionRef, pinRef, frameRef, rowARef, rowBRef])
}
