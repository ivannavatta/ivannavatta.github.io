import { useEffect, useRef } from 'react'
import { CircuitTraces } from '@/shared/components/CircuitTraces/CircuitTraces'
import { Monogram } from '@/shared/components/Monogram/Monogram'
import { ScrollTrigger, gsap, useScroll } from '@/shared/scroll'
import { HERO_PIN, MOBILE_QUERY, POSES, chapterProps } from '@/shared/stage'
import styles from './Placeholders.module.css'

// TEMPORAL (ronda 0): copia fiel del inicio del mockup para probar la escena 3D.
// Se reemplaza por src/features/hero en su ronda.

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a, b, t) => a + (b - a) * t
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function fitLine(el, maxPx) {
  el.style.fontSize = ''
  if (window.matchMedia(MOBILE_QUERY).matches) return
  const parent = el.parentElement
  const cs = getComputedStyle(parent)
  const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
  const prev = el.style.whiteSpace
  el.style.whiteSpace = 'nowrap'
  const range = document.createRange()
  range.selectNodeContents(el)
  const width = range.getBoundingClientRect().width
  const size = parseFloat(getComputedStyle(el).fontSize)
  el.style.whiteSpace = prev
  if (width > 0) el.style.fontSize = `${Math.min(maxPx, ((size * avail) / width) * 0.99)}px`
}

export function HeroPlaceholder() {
  const { reduced } = useScroll()
  const pinRef = useRef(null)
  const frameRef = useRef(null)
  const rowARef = useRef(null)
  const rowBRef = useRef(null)
  const nameRef = useRef(null)

  // El nombre ocupa el ancho de la pantalla
  useEffect(() => {
    const fit = () => fitLine(nameRef.current, 420)
    fit()
    document.fonts?.ready.then(fit)
    let timer = 0
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(fit, 160)
    }
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // El inicio se encoge a un marco; detrás pasan las dos filas de texto
  useEffect(() => {
    if (reduced) return undefined
    const mm = gsap.matchMedia()
    mm.add({ mobile: MOBILE_QUERY, desktop: '(min-width: 768px)' }, (ctx) => {
      const { mobile } = ctx.conditions
      const minScale = mobile ? 0.6 : 0.44
      const frame = frameRef.current
      const rowA = rowARef.current
      const rowB = rowBRef.current
      rowB.style.transform = 'translate3d(-28%,0,0)'
      const st = ScrollTrigger.create({
        trigger: pinRef.current.parentElement,
        start: 'top top',
        end: `+=${mobile ? HERO_PIN.mobile : HERO_PIN.desktop}%`,
        pin: pinRef.current,
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress
          const s = easeInOut(clamp01(p / 0.5))
          frame.style.transform = `scale(${lerp(1, minScale, s).toFixed(4)})`
          rowA.style.transform = `translate3d(${(-p * 28).toFixed(3)}%,0,0)`
          rowB.style.transform = `translate3d(${(-28 + p * 28).toFixed(3)}%,0,0)`
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
  }, [reduced])

  return (
    <section {...chapterProps('inicio', 'light', { backdrop: 'dark' })} className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroPin} ref={pinRef}>
        <div className={styles.heroRows} aria-hidden="true">
          <p className={styles.heroRow}>
            <span ref={rowARef}>Negocio · Datos · Código · Negocio · Datos · Código · Negocio · Datos · Código ·</span>
          </p>
          <p className={`${styles.heroRow} ${styles.heroRowB}`}>
            <span ref={rowBRef}>Pieza por pieza · Pieza por pieza · Pieza por pieza · Pieza por pieza ·</span>
          </p>
        </div>
        <div className={styles.heroFrame} ref={frameRef}>
          <CircuitTraces seed={3} className={styles.heroTraces} />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.heroLead}>
                Desarrollo software de punta a punta, de la base de datos a la interfaz, empezando por lo que necesita el
                negocio.
              </p>
              <p className={styles.heroMeta}>
                Desarrollador · Estudiante de la Lic. en Gestión de la Tecnología de la Información (UADE) · Buenos Aires
              </p>
              <div className={styles.heroActions}>
                <a className={`${styles.btn} ${styles.btnSolid}`} href="#proyectos">
                  Ver proyectos
                </a>
                <a className={`${styles.btn} ${styles.btnQuiet}`} href="/cv.pdf" download>
                  Descargar CV <span className={styles.btnNote}>PDF</span>
                </a>
              </div>
            </div>
            <Monogram pose={POSES.hero} className={styles.heroMono} />
            <h1 className={styles.heroName} id="hero-title" ref={nameRef}>
              <span>Ivan</span> <span>Navatta</span>
            </h1>
          </div>
        </div>
        <Monogram pose={POSES.firma} className={styles.firma} />
      </div>
    </section>
  )
}
