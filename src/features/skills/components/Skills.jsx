import { motion } from 'motion/react'
import { inView, stagger } from '@/shared/animations/variants'
import { Section } from '@/shared/components'
import { useTranslation } from '@/shared/i18n'
import { skillCategories } from '../data/skills'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { SkillCard } from './SkillCard'
import styles from '../Skills.module.css'

export function Skills() {
  const { t } = useTranslation({ es, en })

  return (
    <Section id="skills" index="02" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
      <motion.div className={styles.grid} variants={stagger(0.1)} {...inView}>
        {skillCategories.map((category, index) => (
          <SkillCard
            key={category.id}
            index={index}
            title={t.categories[category.id].title}
            description={t.categories[category.id].description}
            skills={category.skills}
          />
        ))}
      </motion.div>
    </Section>
  )
}
