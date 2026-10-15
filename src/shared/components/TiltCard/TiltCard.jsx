import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'
import { useRef } from 'react'
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import styles from './TiltCard.module.css'

const SPRING = { stiffness: 180, damping: 18 }

/**
 * Tarjeta con inclinación 3D según la posición del cursor
 * y un reflejo de luz que lo sigue.
 */
export function TiltCard({ children, className = '', maxTilt = 10, glare = true, as = 'div', ...props }) {
  const ref = useRef(null)
  const isTouch = useIsTouchDevice()
  const reducedMotion = usePrefersReducedMotion()
  const enabled = !isTouch && !reducedMotion

  const rotateX = useSpring(0, SPRING)
  const rotateY = useSpring(0, SPRING)
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)
  const glareOpacity = useSpring(0, SPRING)
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.14), transparent 55%)`

  const handleMove = (event) => {
    if (!enabled || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    rotateY.set((px - 0.5) * maxTilt * 2)
    rotateX.set(-(py - 0.5) * maxTilt * 2)
    glareX.set(px * 100)
    glareY.set(py * 100)
    glareOpacity.set(1)
  }

  const reset = () => {
    rotateX.set(0)
    rotateY.set(0)
    glareOpacity.set(0)
  }

  const Component = motion[as] ?? motion.div

  return (
    <Component
      ref={ref}
      className={`${styles.card} ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      {...props}
    >
      {children}
      {glare && enabled && (
        <motion.span
          aria-hidden="true"
          className={styles.glare}
          style={{ background: glareBackground, opacity: glareOpacity }}
        />
      )}
    </Component>
  )
}
