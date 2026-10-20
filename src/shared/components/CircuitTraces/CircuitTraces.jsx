import { useEffect, useMemo, useRef, useState } from 'react'
import { MOBILE_QUERY } from '@/shared/stage'
import { traceNet } from '@/shared/utils/traceNet'
import styles from './CircuitTraces.module.css'

/**
 * Trazas de circuito decorativas que llenan su caja (se redibujan al cambiar de tamaño).
 * density: celdas de 48 px por traza; más alto = menos trazas.
 */
export function CircuitTraces({ seed, density = { desktop: 22, mobile: 30 }, className }) {
  const ref = useRef(null)
  const [box, setBox] = useState({ w: 0, h: 0, mobile: false })

  useEffect(() => {
    const svg = ref.current
    if (!svg) return undefined
    const measure = () => {
      const w = Math.round(svg.clientWidth)
      const h = Math.round(svg.clientHeight)
      const mobile = window.matchMedia(MOBILE_QUERY).matches
      setBox((prev) => (prev.w === w && prev.h === h && prev.mobile === mobile ? prev : { w, h, mobile }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  const net = useMemo(
    () => (box.w && box.h ? traceNet(box.w, box.h, seed, box.mobile ? density.mobile : density.desktop) : null),
    [box, seed, density.mobile, density.desktop],
  )

  return (
    <svg
      ref={ref}
      className={className ? `${styles.traces} ${className}` : styles.traces}
      viewBox={net ? `0 0 ${box.w} ${box.h}` : undefined}
      aria-hidden="true"
      focusable="false"
    >
      {net && (
        <>
          <path className={styles.net} d={net.d} />
          {net.pads.map(([x, y], i) => (
            <rect key={i} className={styles.pad} x={x - 3} y={y - 3} width="6" height="6" />
          ))}
        </>
      )}
    </svg>
  )
}
