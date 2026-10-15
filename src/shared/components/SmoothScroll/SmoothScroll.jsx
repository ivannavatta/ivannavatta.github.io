import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { SmoothScrollContext } from './smoothScrollContext'

const NAV_OFFSET = -72

export function SmoothScroll({ children }) {
  const lenisRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return undefined

    const lenis = new Lenis({ duration: 1.2, autoRaf: true })
    lenisRef.current = lenis

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reducedMotion])

  const scrollTo = useCallback(
    (target) => {
      const lenis = lenisRef.current
      if (lenis) {
        lenis.scrollTo(target, { offset: target === 0 ? 0 : NAV_OFFSET })
        return
      }
      if (target === 0) {
        window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
        return
      }
      const element = typeof target === 'string' ? document.querySelector(target) : target
      if (!element) return
      const top = element.getBoundingClientRect().top + window.scrollY + NAV_OFFSET
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' })
    },
    [reducedMotion],
  )

  const lockScroll = useCallback(() => {
    lenisRef.current?.stop()
    document.body.style.overflow = 'hidden'
  }, [])

  const unlockScroll = useCallback(() => {
    lenisRef.current?.start()
    document.body.style.overflow = ''
  }, [])

  const value = useMemo(() => ({ scrollTo, lockScroll, unlockScroll }), [scrollTo, lockScroll, unlockScroll])

  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>
}
