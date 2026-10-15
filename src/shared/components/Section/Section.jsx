import { motion } from 'motion/react'
import { EASE_OUT, fadeUp, inView, stagger } from '../../animations/variants'
import styles from './Section.module.css'

/**
 * Wrapper común de cada sección: id para la navegación,
 * encabezado animado (número + título + subtítulo) y contenedor.
 */
export function Section({ id, index, eyebrow, title, subtitle, children, className = '' }) {
  return (
    <section id={id} className={`${styles.section} ${className}`}>
      <div className="container">
        {title && (
          <motion.header className={styles.header} variants={stagger(0.12)} {...inView}>
            <motion.p className={styles.eyebrow} variants={fadeUp}>
              {index && <span className={styles.index}>{index}</span>}
              <motion.span
                className={styles.line}
                variants={{
                  hidden: { scaleX: 0 },
                  visible: { scaleX: 1, transition: { duration: 0.9, ease: EASE_OUT } },
                }}
              />
              {eyebrow}
            </motion.p>
            <motion.h2 className={styles.title} variants={fadeUp}>
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p className={styles.subtitle} variants={fadeUp}>
                {subtitle}
              </motion.p>
            )}
          </motion.header>
        )}
        {children}
      </div>
    </section>
  )
}
