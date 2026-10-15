import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FiCheck, FiExternalLink, FiGithub, FiX } from 'react-icons/fi'
import { EASE_OUT } from '@/shared/animations/variants'
import { Button } from '@/shared/components'
import { useSmoothScroll } from '@/shared/hooks'
import { ProjectCover } from './ProjectCover'
import styles from '../Projects.module.css'

export function ProjectModal({ project, index, onClose, t, localize }) {
  const closeRef = useRef(null)
  const { lockScroll, unlockScroll } = useSmoothScroll()

  useEffect(() => {
    if (!project) return undefined
    lockScroll()
    closeRef.current?.focus()
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      unlockScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [project, onClose, lockScroll, unlockScroll])

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          className={styles.backdrop}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } }}
            exit={{ opacity: 0, y: 40, scale: 0.96, transition: { duration: 0.25 } }}
            data-lenis-prevent
          >
            <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label={t.close}>
              <FiX />
            </button>

            <div className={styles.modalCover}>
              <ProjectCover project={project} title={localize(project.title)} index={index} />
            </div>

            <div className={styles.modalBody}>
              <span className={styles.year}>{project.year}</span>
              <h3 id="project-modal-title" className={styles.modalTitle}>
                {localize(project.title)}
              </h3>
              <p className={styles.modalDescription}>{localize(project.description)}</p>

              {project.highlights && (
                <>
                  <h4 className={styles.modalHeading}>{t.highlights}</h4>
                  <ul className={styles.highlightList}>
                    {localize(project.highlights).map((highlight) => (
                      <li key={highlight}>
                        <FiCheck aria-hidden="true" /> {highlight}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h4 className={styles.modalHeading}>{t.stack}</h4>
              <ul className={styles.tags}>
                {project.tech.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>

              <div className={styles.modalActions}>
                {project.demo && (
                  <Button href={project.demo} icon={<FiExternalLink />} size="sm">
                    {t.demo}
                  </Button>
                )}
                {project.repo && (
                  <Button href={project.repo} variant="ghost" icon={<FiGithub />} size="sm">
                    {t.code}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
