import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { MOTION_STATE, ROOT_CLASS, setMotionState } from '../stage/contract'
import { ScrollTrigger, gsap } from './gsap'
import { REDUCED_MOTION } from './motionPreference'
import { ScrollContext } from './scrollContext'

const SCROLL_DURATION = 1.4
// En un dispositivo solo táctil el scroll nativo lo mueve el compositor del navegador, antes de
// que la escena lea los rectángulos del DOM: en Safari iOS los bloques del IN se despegaban de
// las teclas del Stack. Con syncTouch, Lenis aplica el scroll en el mismo cuadro que la escena.
const TOUCH_ONLY = '(hover: none), (pointer: coarse)'

/** Elemento que recibe el foco al llegar: el título de la sección, o la sección misma. */
function focusTargetOf(element) {
  return element.querySelector('h1, h2') ?? element
}

function resolveTarget(target) {
  if (typeof target === 'number') return target
  // getElementById y no querySelector: un id que no es un selector válido no tira SyntaxError
  if (typeof target === 'string') {
    return target.startsWith('#') && target.length > 1 ? document.getElementById(target.slice(1)) : null
  }
  return target instanceof Element ? target : null
}

/**
 * Lenis + GSAP ScrollTrigger sincronizados en un solo ticker, como en el mockup:
 * Lenis suaviza el scroll de la ventana y avisa a ScrollTrigger en cada cuadro.
 * Con movimiento reducido no se crea Lenis y el scroll es el nativo.
 *
 * También intercepta los links internos (a[href^="#"]) para desplazarse con Lenis
 * y mover el foco al título de la sección de destino. Un componente que necesite
 * otro comportamiento llama a event.preventDefault() en su onClick.
 */
export function ScrollProvider({ children }) {
  const lenisRef = useRef(null)

  // useLayoutEffect: tiene que existir antes de que las features creen sus ScrollTriggers
  // (los efectos pasivos de los hijos corren después de los de layout de toda la página).
  useLayoutEffect(() => {
    if (REDUCED_MOTION) return undefined
    const root = document.documentElement
    let lenis
    try {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: window.matchMedia(TOUCH_ONLY).matches })
    } catch (err) {
      console.warn('[IN] Scroll suave no disponible:', err?.message)
      setMotionState(MOTION_STATE.static)
      return undefined
    }
    setMotionState(MOTION_STATE.pending) // stage pasa a ready cuando termina la escena
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis.raf(time * 1000)
    // prioritize: Lenis mueve el scroll antes que cualquier otro callback del ticker
    gsap.ticker.add(raf, false, true)
    gsap.ticker.lagSmoothing(0)
    root.classList.add(ROOT_CLASS.live)
    if (import.meta.env.DEV) window.__lenis = lenis

    return () => {
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      lenisRef.current = null
      root.classList.remove(ROOT_CLASS.live)
      if (import.meta.env.DEV) delete window.__lenis
    }
  }, [])

  const scrollTo = useCallback((target, { focusNow = false } = {}) => {
    const resolved = resolveTarget(target)
    if (resolved === null) return
    const focusEl = typeof resolved === 'number' ? null : focusTargetOf(resolved)
    const focus = () => {
      if (!focusEl) return
      if (!focusEl.matches('a[href], button, input, textarea, select, [tabindex]')) focusEl.setAttribute('tabindex', '-1')
      focusEl.focus({ preventScroll: true })
    }
    if (focusNow) focus()

    const lenis = lenisRef.current
    if (lenis) {
      lenis.resize()
      lenis.scrollTo(resolved, { duration: SCROLL_DURATION, onComplete: focus })
      return
    }
    const behavior = REDUCED_MOTION ? 'auto' : 'smooth'
    if (typeof resolved === 'number') window.scrollTo({ top: resolved, behavior })
    else resolved.scrollIntoView({ behavior })
    focus()
  }, [])

  const lockScroll = useCallback((on) => {
    const style = document.documentElement.style
    style.overflow = on ? 'hidden' : ''
    style.scrollbarGutter = on ? 'stable' : '' // sin salto si hay barra de scroll clásica
    const lenis = lenisRef.current
    if (lenis) {
      if (on) lenis.stop()
      else lenis.start()
    }
  }, [])

  const refresh = useCallback(() => {
    lenisRef.current?.resize()
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
  }, [])

  const getLenis = useCallback(() => lenisRef.current, [])

  // Links internos: Lenis + foco en el título de destino
  useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
      const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null
      if (!link) return
      const hash = link.getAttribute('href')
      if (hash.length < 2 || !document.getElementById(hash.slice(1))) return
      event.preventDefault()
      scrollTo(hash)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [scrollTo])

  const value = useMemo(
    () => ({ reduced: REDUCED_MOTION, scrollTo, lockScroll, refresh, getLenis }),
    [scrollTo, lockScroll, refresh, getLenis],
  )

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
}
