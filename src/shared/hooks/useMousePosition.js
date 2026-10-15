import { useEffect, useRef } from 'react'

/**
 * Posición del mouse normalizada (-1 a 1) guardada en un ref,
 * para animaciones por frame sin provocar re-renders.
 */
export function useMousePosition() {
  const position = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (event) => {
      position.current.x = (event.clientX / window.innerWidth) * 2 - 1
      position.current.y = -((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return position
}
