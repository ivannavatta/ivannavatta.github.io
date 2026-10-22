import { useRef } from 'react'
import { POSES, chapterProps, poseProps } from '@/shared/stage'
import { PROJECTS } from '../data/projects'
import { useCaseStack } from '../hooks/useCaseStack'
import { copy } from '../i18n'
import { ProjectCase } from './ProjectCase'
import styles from './Projects.module.css'

/**
 * Proyectos: título, bajada y los cuatro casos. En escritorio el bloque queda fijo y los casos
 * se apilan con el scroll sobre una base de ladrillos (la pose "visor" del IN).
 */
export function Projects() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const caseRefs = useRef([])
  const t = copy.projects
  useCaseStack({ sectionRef, pinRef, caseRefs, pinnedClass: styles.isPinned })

  return (
    <section ref={sectionRef} {...chapterProps('proyectos', 'dark')} className={styles.work} aria-labelledby="work-title">
      <div className={styles.pin} ref={pinRef}>
        <div className={styles.head}>
          <h2 className={styles.title} id="work-title">
            {t.title}
          </h2>
          <p className={styles.intro}>{t.intro}</p>
        </div>
        <div className={styles.stage}>
          {PROJECTS.map((project, i) => (
            <ProjectCase
              key={project.id}
              project={project}
              caseRef={(el) => {
                caseRefs.current[i] = el
              }}
            />
          ))}
        </div>
        {/* Base de ladrillos: la escena 3D arma acá la pose "visor" del IN */}
        <div className={styles.base} {...poseProps(POSES.visor, { layout: 'bricks' })} aria-hidden="true" />
      </div>
    </section>
  )
}
