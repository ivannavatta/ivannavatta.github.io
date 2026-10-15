import { animate, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks'
import styles from '../About.module.css'

/** Número que cuenta desde 0 cuando entra en pantalla. Si `value` es texto, se muestra tal cual. */
export function StatCounter({ value, suffix = '', label }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.6 })
  const reducedMotion = usePrefersReducedMotion()
  const isNumber = typeof value === 'number'
  const [display, setDisplay] = useState(isNumber ? 0 : value)

  useEffect(() => {
    if (!isNumber || !isInView || reducedMotion) return undefined
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [isInView, isNumber, value, reducedMotion])

  return (
    <div ref={ref} className={styles.stat}>
      <span className={`${styles.statValue} gradient-text`}>
        {isNumber && reducedMotion ? value : display}
        {suffix}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
