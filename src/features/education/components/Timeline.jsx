import { motion, useScroll, useSpring } from 'motion/react'
import { useRef } from 'react'
import { FiAward, FiBookOpen, FiCode, FiMonitor } from 'react-icons/fi'
import { inView, slideInLeft, slideInRight } from '@/shared/animations/variants'
import { Section } from '@/shared/components'
import { useTranslation } from '@/shared/i18n'
import { timeline } from '../data/education'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { Certifications } from './Certifications'
import styles from '../Timeline.module.css'

const ICONS = {
  education: FiBookOpen,
  experience: FiCode,
  course: FiMonitor,
  certification: FiAward,
}

export function Timeline() {
  const { t, lang, localize } = useTranslation({ es, en })
  const listRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 55%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 25 })

  return (
    <Section id="education" index="04" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
      <div ref={listRef} className={styles.wrapper}>
        <span className={styles.track} aria-hidden="true">
          <motion.span className={styles.fill} style={{ scaleY: progress }} />
        </span>

        <ol className={styles.timeline}>
          {timeline.map((entry, index) => {
            const Icon = ICONS[entry.type] ?? FiCode
            const side = index % 2 === 0 ? 'left' : 'right'
            return (
              <li key={entry.id} className={`${styles.item} ${styles[side]}`}>
                <motion.span
                  className={styles.dot}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <Icon aria-hidden="true" />
                </motion.span>

                <motion.article
                  className={styles.card}
                  variants={side === 'left' ? slideInLeft : slideInRight}
                  {...inView}
                >
                  <span className={styles.period}>{localize(entry.period)}</span>
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
                </motion.article>
              </li>
            )
          })}
        </ol>
      </div>

      <Certifications t={t.certifications} lang={lang} localize={localize} />
    </Section>
  )
}
