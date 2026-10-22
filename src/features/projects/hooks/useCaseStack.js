import { useEffect } from 'react'
import { ScrollTrigger, gsap, useScroll } from '@/shared/scroll'

const PIN_QUERY = '(min-width: 1024px) and (min-height: 700px)'
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const STEP = 0.9 // pantallas de scroll por cada caso que entra
const LIFT = 8 // px que sube cada caso de atrás: 3 × 8 = 24 < 28 de separación con la bajada
const SHRINK = 0.045 // cuánto se achica cada caso de atrás
const TILT = { x: 3, y: 2.4, ease: 0.12 } // grados máximos e inercia de la inclinación
const RESIZE_DEBOUNCE = 250

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Casos apilados (escritorio con altura suficiente): el bloque queda fijo y cada caso entra
 * desde abajo mientras los anteriores se achican y suben un poco. Solo transform.
 * - Solo se apila si el caso más alto entra entero en la pantalla; si no (p. ej. 1440 × 700),
 *   los casos quedan uno debajo del otro, como en tablet: nunca hay texto cortado o tapado.
 * - Los casos de atrás suben 8 px por nivel: no alcanzan la bajada del encabezado.
 * - Si el foco de teclado entra a un caso que todavía no entró, el scroll salta hasta él.
 * - Inclinación 3D sutil con el cursor (solo puntero fino), con inercia.
 * Con movimiento reducido no hace nada.
 */
export function useCaseStack({ sectionRef, pinRef, caseRefs, pinnedClass }) {
  const { reduced, getLenis, refresh } = useScroll()

  useEffect(() => {
    const section = sectionRef.current
    const pinEl = pinRef.current
    const cases = caseRefs.current.filter(Boolean)
    if (reduced || !section || !pinEl || cases.length < 2) return undefined
    const n = cases.length
    const tilt = cases.map(() => ({ x: 0, y: 0, tx: 0, ty: 0 }))
    let progress = 0
    let pinned = false
    const cleanups = []

    const tiltOf = (i) => `perspective(1400px) rotateX(${tilt[i].y.toFixed(3)}deg) rotateY(${tilt[i].x.toFixed(3)}deg)`
    const resetCases = () =>
      cases.forEach((c) => {
        c.style.transform = ''
        c.style.opacity = ''
        c.style.pointerEvents = ''
      })

    function layout() {
      const f = progress * (n - 1)
      cases.forEach((c, i) => {
        if (!pinned) {
          c.style.transform = tilt[i].x || tilt[i].y ? tiltOf(i) : ''
          return
        }
        const enter = i === 0 ? 1 : easeInOut(clamp01(f - (i - 1)))
        let depth = 0
        for (let j = i + 1; j < n; j++) depth += easeInOut(clamp01(f - (j - 1)))
        const y = (1 - enter) * 110
        const scale = 1 - depth * SHRINK
        const lift = depth * -LIFT
        c.style.transform = `translate3d(0, calc(${y.toFixed(3)}% + ${lift.toFixed(2)}px), 0) scale(${scale.toFixed(4)}) ${tiltOf(i)}`
        // Todavía abajo: invisible y sin puntero, pero enfocable (no visibility: hidden), así el
        // teclado puede entrar y el scroll lo trae (ver onFocus)
        const waiting = enter <= 0.0001
        c.style.opacity = waiting ? '0' : ''
        c.style.pointerEvents = waiting ? 'none' : ''
      })
    }

    // Inclinación con el cursor
    if (window.matchMedia(FINE_POINTER).matches) {
      cases.forEach((c, i) => {
        const onMove = (e) => {
          const r = c.getBoundingClientRect()
          tilt[i].tx = ((e.clientX - r.left) / r.width - 0.5) * TILT.x
          tilt[i].ty = -((e.clientY - r.top) / r.height - 0.5) * TILT.y
        }
        const onLeave = () => {
          tilt[i].tx = 0
          tilt[i].ty = 0
        }
        c.addEventListener('pointermove', onMove)
        c.addEventListener('pointerleave', onLeave)
        cleanups.push(() => {
          c.removeEventListener('pointermove', onMove)
          c.removeEventListener('pointerleave', onLeave)
        })
      })
      const tick = () => {
        let moving = false
        for (const t of tilt) {
          const dx = t.tx - t.x
          const dy = t.ty - t.y
          if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
            t.x += dx * TILT.ease
            t.y += dy * TILT.ease
            moving = true
          }
        }
        if (moving) layout()
      }
      gsap.ticker.add(tick)
      cleanups.push(() => gsap.ticker.remove(tick))
    }

    /** Con el layout apilado aplicado: ¿el caso más alto entra entero en el bloque fijo? */
    function stackFits() {
      const stage = cases[0].parentElement
      const bottomLimit = pinEl.clientHeight - parseFloat(getComputedStyle(pinEl).paddingBottom)
      return cases.every((c) => stage.offsetTop + c.offsetHeight <= bottomLimit)
    }

    let unpin = null
    function createPin() {
      pinned = true
      const st = ScrollTrigger.create({
        trigger: pinEl,
        start: 'top top',
        end: () => `+=${(n - 1) * window.innerHeight * STEP}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress = self.progress
          layout()
        },
        onRefresh: (self) => {
          progress = self.progress
          layout()
        },
      })
      const onFocus = (e) => {
        if (!(e.target instanceof Element) || !e.target.matches(':focus-visible')) return
        const i = cases.findIndex((c) => c.contains(e.target))
        if (i < 0) return
        const y = st.start + (st.end - st.start) * (i / (n - 1))
        const lenis = getLenis()
        if (lenis) lenis.scrollTo(y, { immediate: true })
        else window.scrollTo(0, y)
      }
      section.addEventListener('focusin', onFocus)
      return () => {
        pinned = false
        section.removeEventListener('focusin', onFocus)
        st.kill()
        section.classList.remove(pinnedClass)
        resetCases()
      }
    }

    // Decide si se apila: ancho y alto mínimos, y que el contenido entre (se mide con la clase puesta)
    function evaluate() {
      const want = window.matchMedia(PIN_QUERY).matches
      if (unpin) {
        unpin()
        unpin = null
      }
      if (want) {
        section.classList.add(pinnedClass)
        if (stackFits()) unpin = createPin()
        else section.classList.remove(pinnedClass)
      }
    }
    evaluate()
    // Con las fuentes cargadas cambian los altos: volver a medir
    let alive = true
    document.fonts?.ready.then(() => {
      if (!alive) return
      evaluate()
      refresh()
    })

    let timer = 0
    let lastSize = `${window.innerWidth}x${window.innerHeight}`
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const size = `${window.innerWidth}x${window.innerHeight}`
        if (size === lastSize) return
        lastSize = size
        evaluate()
        refresh() // el alto de la página cambió: recalcular pins, escena y costuras
      }, RESIZE_DEBOUNCE)
    }
    window.addEventListener('resize', onResize)

    return () => {
      alive = false
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      if (unpin) unpin()
      cleanups.forEach((fn) => fn())
      resetCases()
    }
  }, [reduced, getLenis, refresh, sectionRef, pinRef, caseRefs, pinnedClass])
}
