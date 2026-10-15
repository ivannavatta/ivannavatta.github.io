import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import styles from './CustomCursor.module.css'

const INTERACTIVE = 'a, button, input, textarea, [role="button"], [data-cursor]'

/** Cursor de punto + anillo con inercia. Solo en dispositivos con mouse. */
export function CustomCursor() {
  const isTouch = useIsTouchDevice()
  const reducedMotion = usePrefersReducedMotion()
  const enabled = !isTouch && !reducedMotion

  const [hovering, setHovering] = useState(false)
  const [label, setLabel] = useState('')
  const [visible, setVisible] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 350, damping: 30, mass: 0.5 })
  const ringY = useSpring(y, { stiffness: 350, damping: 30, mass: 0.5 })

  useEffect(() => {
    if (!enabled) return undefined
    document.body.classList.add('has-custom-cursor')

    const onMove = (event) => {
      x.set(event.clientX)
      y.set(event.clientY)
      setVisible(true)
    }
    const onOver = (event) => {
      const target = event.target.closest?.(INTERACTIVE)
      setHovering(Boolean(target))
      setLabel(target?.dataset?.cursor ?? '')
    }
    const onLeave = () => setVisible(false)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver)
    document.documentElement.addEventListener('pointerleave', onLeave)

    return () => {
      document.body.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <>
      <motion.div
        aria-hidden="true"
        className={styles.dot}
        style={{ x, y, opacity: visible ? 1 : 0 }}
        animate={{ scale: hovering ? 0 : 1 }}
      />
      <motion.div
        aria-hidden="true"
        className={`${styles.ring} ${label ? styles.withLabel : ''}`}
        style={{ x: ringX, y: ringY, opacity: visible ? 1 : 0 }}
        animate={{ scale: label ? 2.4 : hovering ? 1.7 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {label && <span className={styles.label}>{label}</span>}
      </motion.div>
    </>
  )
}
