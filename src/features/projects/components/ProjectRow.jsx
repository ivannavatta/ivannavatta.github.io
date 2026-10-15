import { motion } from 'motion/react'
import { FiArrowUpRight } from 'react-icons/fi'
import { EASE_OUT } from '@/shared/animations/variants'
import { ProjectCover } from './ProjectCover'
import styles from '../Projects.module.css'

/** Fila editorial de un proyecto: número, título, tecnologías, año y flecha. */
export function ProjectRow({ ref, project, index, number, t, localize, onOpen, onHover }) {
  const title = localize(project.title)

  return (
    <motion.li
      ref={ref}
      layout
      className={styles.rowItem}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: number * 0.06 }}
    >
      <button
        type="button"
        className={styles.row}
        onClick={() => onOpen(project)}
        onPointerEnter={() => onHover({ project, index })}
        onPointerLeave={() => onHover(null)}
        aria-label={`${t.viewDetails}: ${title}`}
      >
        <span className={styles.rowCover}>
          <ProjectCover project={project} title={title} index={index} />
        </span>
        <span className={styles.rowIndex}>{String(number + 1).padStart(2, '0')}</span>
        <span className={styles.rowMain}>
          <span className={styles.rowTitle}>
            {title}
            {project.featured && <span className={styles.featuredTag}>{t.featured}</span>}
          </span>
          <span className={styles.rowSummary}>{localize(project.summary)}</span>
        </span>
        <span className={styles.rowTech}>{project.tech.join(' · ')}</span>
        <span className={styles.rowYear}>{project.year}</span>
        <span className={styles.rowArrow} aria-hidden="true">
          <FiArrowUpRight />
        </span>
      </button>
    </motion.li>
  )
}
