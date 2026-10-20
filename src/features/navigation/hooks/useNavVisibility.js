import { useCallback, useEffect, useRef, useState } from 'react'
import { useScrollTick } from './useScrollTick'

const NAV_TOP = 64 // arriba de todo (inicio) siempre visible
const NAV_HIDE = 40 // px seguidos hacia abajo para esconderla
const NAV_SHOW = 24 // px seguidos hacia arriba para mostrarla

/**
 * Esconder al bajar y mostrar al subir (escritorio y tablet; en mobile la barra es fija).
 * Con foco de teclado dentro de la cabecera aparece y se queda mientras el foco esté adentro.
 */
export function useNavVisibility(headerRef, { pinned }) {
  const [hidden, setHidden] = useState(false)
  const state = useRef({ y: typeof window === 'undefined' ? 0 : window.scrollY, acc: 0, keyboard: false })

  const onTick = useCallback(
    (y) => {
      const s = state.current
      const d = y - s.y
      s.y = y
      if (y <= NAV_TOP || s.keyboard || pinned) {
        s.acc = 0
        setHidden(false)
        return
      }
      if (!d) return
      if (d > 0 !== s.acc > 0) s.acc = 0 // cambio de sentido: el umbral vuelve a empezar
      s.acc += d
      if (s.acc >= NAV_HIDE) setHidden(true)
      else if (s.acc <= -NAV_SHOW) setHidden(false)
    },
    [pinned],
  )
  useScrollTick(onTick)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return undefined
    const onFocusIn = (e) => {
      if (!(e.target instanceof Element) || !e.target.matches(':focus-visible')) return
      state.current.keyboard = true
      setHidden(false)
    }
    const onFocusOut = (e) => {
      if (!header.contains(e.relatedTarget)) state.current.keyboard = false
    }
    header.addEventListener('focusin', onFocusIn)
    header.addEventListener('focusout', onFocusOut)
    return () => {
      header.removeEventListener('focusin', onFocusIn)
      header.removeEventListener('focusout', onFocusOut)
    }
  }, [headerRef])

  return hidden && !pinned
}
