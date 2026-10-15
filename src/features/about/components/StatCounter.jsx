import { animate, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks'
import styles from '../About.module.css'

/** Número grande que cuenta desde 0 cuando entra en pantalla. */
export function StatCounter({ value, suffix = '', label }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.6 })
  const reducedMotion = usePrefersReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isInView || reducedMotion) return undefined
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [isInView, value, reducedMotion])

  return (
    <div ref={ref} className={styles.stat}>
      <span className={styles.statValue}>
        {reducedMotion ? value : display}
        {suffix}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
