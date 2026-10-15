import { motion } from 'motion/react'
import { fadeUp, inView } from '@/shared/animations/variants'
import { Divider, Section } from '@/shared/components'
import { useTranslation } from '@/shared/i18n'
import { timeline } from '../data/education'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { Certifications } from './Certifications'
import styles from '../Timeline.module.css'

export function Timeline() {
  const { t, lang, localize } = useTranslation({ es, en })

  return (
    <Section id="education" index="04" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
      <ol className={styles.list}>
        {timeline.map((entry, index) => (
          <li key={entry.id} className={styles.item}>
            <Divider delay={index * 0.1} />
            <motion.div className={styles.row} variants={fadeUp} {...inView}>
              <span className={styles.period}>{localize(entry.period)}</span>
              <div className={styles.body}>
                <h3 className={styles.title}>{localize(entry.title)}</h3>
                <p className={styles.place}>{localize(entry.place)}</p>
                <p className={styles.description}>{localize(entry.description)}</p>
                {entry.tags && (
                  <ul className={styles.tags}>
                    {localize(entry.tags).map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </li>
        ))}
      </ol>

      <Certifications t={t.certifications} lang={lang} localize={localize} />
    </Section>
  )
}
