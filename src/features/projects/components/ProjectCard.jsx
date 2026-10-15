import { motion } from 'motion/react'
import { FiArrowUpRight, FiExternalLink, FiGithub } from 'react-icons/fi'
import { EASE_OUT } from '@/shared/animations/variants'
import { TiltCard } from '@/shared/components'
import { ProjectCover } from './ProjectCover'
import styles from '../Projects.module.css'

// `ref` se reenvía al article para que AnimatePresence (modo popLayout) pueda medirlo
export function ProjectCard({ ref, project, index, t, localize, onOpen }) {
  const title = localize(project.title)

  return (
    <motion.article
      ref={ref}
      layout
      className={`${styles.cardWrapper} ${project.featured ? styles.featured : ''}`}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: index * 0.06 }}
    >
      <TiltCard className={styles.card} maxTilt={5}>
        <button
          type="button"
          className={styles.cover}
          onClick={() => onOpen(project)}
          data-cursor={t.cursor}
          aria-label={`${t.viewDetails}: ${title}`}
        >
          <ProjectCover project={project} title={title} index={index} />
          <span className={styles.coverOverlay}>
            {t.viewDetails} <FiArrowUpRight />
          </span>
          {project.featured && <span className={styles.featuredBadge}>{t.featured}</span>}
        </button>

        <div className={styles.body}>
          <div className={styles.bodyTop}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <span className={styles.year}>{project.year}</span>
          </div>
          <p className={styles.summary}>{localize(project.summary)}</p>

          <ul className={styles.tags}>
            {project.tech.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>

          <div className={styles.links}>
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noopener noreferrer" className={styles.link}>
                <FiGithub /> {t.code}
              </a>
            )}
            {project.demo && (
              <a href={project.demo} target="_blank" rel="noopener noreferrer" className={styles.link}>
                <FiExternalLink /> {t.demo}
              </a>
            )}
          </div>
        </div>
      </TiltCard>
    </motion.article>
  )
}
