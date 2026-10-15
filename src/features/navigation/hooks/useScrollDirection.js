import { useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'

/** Indica si la página está scrolleada y si el usuario baja (para ocultar la navbar). */
export function useScrollDirection(threshold = 30) {
  const { scrollY } = useScroll()
  const [state, setState] = useState({ scrolled: false, hidden: false })

  useMotionValueEvent(scrollY, 'change', (current) => {
    const previous = scrollY.getPrevious() ?? 0
    const scrolled = current > threshold
    const hidden = current > 400 && current > previous
    setState((prev) => (prev.scrolled === scrolled && prev.hidden === hidden ? prev : { scrolled, hidden }))
  })

  return state
}
