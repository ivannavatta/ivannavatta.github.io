import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect } from 'react'
import { useIsTouchDevice, usePrefersReducedMotion } from '@/shared/hooks'
import { ProjectCover } from './ProjectCover'
import styles from '../Projects.module.css'

const SPRING = { stiffness: 260, damping: 28, mass: 0.6 }

/** Portada del proyecto que flota junto al cursor mientras se recorre la lista (solo desktop). */
export function ProjectHoverPreview({ hovered, localize }) {
  const isTouch = useIsTouchDevice()
  const reducedMotion = usePrefersReducedMotion()
  const x = useSpring(useMotionValue(0), SPRING)
  const y = useSpring(useMotionValue(0), SPRING)
  const enabled = !isTouch && !reducedMotion

  useEffect(() => {
    if (!enabled) return undefined
    const onMove = (event) => {
      x.set(event.clientX + 24)
      y.set(event.clientY - 110)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <motion.div className={styles.preview} style={{ x, y }} aria-hidden="true">
      <AnimatePresence mode="popLayout">
        {hovered && (
          <motion.div
            key={hovered.project.id}
            className={styles.previewInner}
            initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProjectCover project={hovered.project} title={localize(hovered.project.title)} index={hovered.index} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
