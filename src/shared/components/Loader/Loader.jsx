import { animate, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { EASE_OUT } from '../../animations/variants'
import { profile } from '../../data/profile'
import { common } from '../../i18n/common'
import { useTranslation } from '../../i18n/useTranslation'
import styles from './Loader.module.css'

/** Pantalla de carga inicial con contador. Llama a onComplete al terminar. */
export function Loader({ onComplete, duration = 1.6 }) {
  const { t } = useTranslation(common)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const controls = animate(0, 100, {
      duration,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (value) => setProgress(Math.round(value)),
      onComplete: () => setTimeout(onComplete, 250),
    })
    return () => controls.stop()
  }, [duration, onComplete])

  return (
    <motion.div
      className={styles.loader}
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
      role="status"
      aria-live="polite"
    >
      <div className={styles.center}>
        <motion.span
          className={`${styles.initials} gradient-text`}
          initial={{ opacity: 0, scale: 0.6, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
        >
          {profile.initials}
        </motion.span>
        <div className={styles.bar}>
          <span className={styles.fill} style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
        <div className={styles.meta}>
          <span>{t.loader}</span>
          <span>{String(progress).padStart(3, '0')}%</span>
        </div>
      </div>
    </motion.div>
  )
}
