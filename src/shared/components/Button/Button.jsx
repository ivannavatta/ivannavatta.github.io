import { motion, useMotionValue, useSpring } from 'motion/react'
import { useRef } from 'react'
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import styles from './Button.module.css'

const SPRING = { stiffness: 220, damping: 15, mass: 0.4 }

/**
 * Botón con efecto "magnético": se desplaza levemente hacia el cursor.
 * Se renderiza como <a> si recibe `href`, si no como <button>.
 */
export function Button({
  children,
  href,
  variant = 'primary',
  size = 'md',
  icon,
  magnetic = true,
  strength = 0.3,
  className = '',
  ...props
}) {
  const ref = useRef(null)
  const isTouch = useIsTouchDevice()
  const reducedMotion = usePrefersReducedMotion()
  const enabled = magnetic && !isTouch && !reducedMotion

  const x = useSpring(useMotionValue(0), SPRING)
  const y = useSpring(useMotionValue(0), SPRING)

  const handleMove = (event) => {
    if (!enabled || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const Component = href ? motion.a : motion.button
  const linkProps = href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <Component
      ref={ref}
      href={href}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      style={{ x, y }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      whileTap={{ scale: 0.96 }}
      {...linkProps}
      {...props}
    >
      <span className={styles.label}>{children}</span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </Component>
  )
}
