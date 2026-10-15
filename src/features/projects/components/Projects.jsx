import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { FiGithub } from 'react-icons/fi'
import { fadeUp, inView } from '@/shared/animations/variants'
import { Button, Section } from '@/shared/components'
import { profile } from '@/shared/data/profile'
import { useTranslation } from '@/shared/i18n'
import { projects } from '../data/projects'
import { useProjectFilter } from '../hooks/useProjectFilter'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { ProjectCard } from './ProjectCard'
import { ProjectModal } from './ProjectModal'
import { TechFilter } from './TechFilter'
import styles from '../Projects.module.css'

export function Projects() {
  const { t, localize } = useTranslation({ es, en })
  const { filters, active, setActive, filtered } = useProjectFilter(projects)
  const [selected, setSelected] = useState(null)

  const close = useCallback(() => setSelected(null), [])

  return (
    <Section id="projects" index="03" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
      <motion.div variants={fadeUp} {...inView}>
        <TechFilter filters={filters} active={active} onChange={setActive} allLabel={t.all} label={t.filterLabel} />
      </motion.div>

      <motion.div layout className={styles.grid}>
        <AnimatePresence mode="popLayout">
          {filtered.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              t={t}
              localize={localize}
              onOpen={setSelected}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && <p className={styles.empty}>{t.empty}</p>}

      <motion.div className={styles.more} variants={fadeUp} {...inView}>
        <Button href={profile.contact.github} variant="ghost" icon={<FiGithub />}>
          {t.moreOnGithub}
        </Button>
      </motion.div>

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
