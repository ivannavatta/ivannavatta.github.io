import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { FiGithub } from 'react-icons/fi'
import { fadeUp, inView } from '@/shared/animations/variants'
import { ArrowLink, Section } from '@/shared/components'
import { profile } from '@/shared/data/profile'
import { useTranslation } from '@/shared/i18n'
import { projects } from '../data/projects'
import { useProjectFilter } from '../hooks/useProjectFilter'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { ProjectHoverPreview } from './ProjectHoverPreview'
import { ProjectModal } from './ProjectModal'
import { ProjectRow } from './ProjectRow'
import { TechFilter } from './TechFilter'
import styles from '../Projects.module.css'

export function Projects() {
  const { t, localize } = useTranslation({ es, en })
  const { filters, active, setActive, filtered } = useProjectFilter(projects)
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)

  const close = useCallback(() => setSelected(null), [])

  const open = (project) => {
    setHovered(null)
    setSelected(project)
  }

  return (
    <Section id="projects" index="03" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
      <motion.div variants={fadeUp} {...inView}>
        <TechFilter filters={filters} active={active} onChange={setActive} allLabel={t.all} label={t.filterLabel} />
      </motion.div>

      <ul className={styles.list} onPointerLeave={() => setHovered(null)}>
        <AnimatePresence mode="popLayout">
          {filtered.map((project, number) => (
            <ProjectRow
              key={project.id}
              project={project}
              index={projects.indexOf(project)}
              number={number}
              t={t}
              localize={localize}
              onOpen={open}
              onHover={setHovered}
            />
          ))}
        </AnimatePresence>
      </ul>

      {filtered.length === 0 && <p className={styles.empty}>{t.empty}</p>}

      <motion.div className={styles.more} variants={fadeUp} {...inView}>
        <ArrowLink href={profile.contact.github} icon={<FiGithub />}>
          {t.moreOnGithub}
        </ArrowLink>
      </motion.div>

      <ProjectHoverPreview hovered={hovered} localize={localize} />

      <ProjectModal
        project={selected}
        index={selected ? projects.indexOf(selected) : 0}
        onClose={close}
        t={t}
        localize={localize}
      />
    </Section>
  )
}
