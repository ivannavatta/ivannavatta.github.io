import { motion } from 'motion/react'
import { fadeUp, inView } from '../../animations/variants'
import { Divider } from '../Divider/Divider'
import { RevealText } from '../RevealText/RevealText'
import { toSegments } from '../../utils/segments'
import styles from './Section.module.css'

/**
 * Sección con encabezado editorial: etiqueta "(01) Nombre" a la izquierda,
 * título grande revelado y subtítulo a la derecha.
 */
export function Section({ id, index, eyebrow, title, subtitle, children, className = '' }) {
  return (
    <section id={id} className={`${styles.section} ${className}`}>
      <div className="container">
        <Divider />
        {title && (
          <header className={styles.header}>
            <motion.p className={styles.eyebrow} variants={fadeUp} {...inView}>
              {index && <span className={styles.index}>({index})</span>}
              {eyebrow}
            </motion.p>
            <div className={styles.heading}>
              <RevealText as="h2" className={styles.title} text={toSegments(title)} />
              {subtitle && (
                <motion.p className={styles.subtitle} variants={fadeUp} {...inView}>
                  {subtitle}
                </motion.p>
              )}
            </div>
          </header>
        )}
        {children}
      </div>
    </section>
  )
}
