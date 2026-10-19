import { motion } from 'motion/react'
import { fadeUp, inView, stagger } from '@/shared/animations/variants'
import { ArrowLink, Divider, Section } from '@/shared/components'
import { certifications } from '@/shared/data/certifications'
import { profile } from '@/shared/data/profile'
import { technologyList } from '@/shared/data/technologies'
import { useYearsCoding } from '@/shared/hooks'
import { useTranslation } from '@/shared/i18n'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { StatCounter } from './StatCounter'
import styles from '../About.module.css'

export function About() {
  const { t, localize } = useTranslation({ es, en })
  const years = useYearsCoding()

  const fill = (text) => text.replace('{name}', profile.fullName).replace('{years}', years)

  return (
    <Section id="about" index="01" eyebrow={t.eyebrow} title={t.title}>
      <div className={styles.grid}>
        <motion.aside className={styles.profile} variants={fadeUp} {...inView}>
          <div className={styles.avatar}>
            {profile.photo ? (
              <img src={profile.photo} alt={profile.fullName} />
            ) : (
              <span aria-hidden="true">{profile.initials}</span>
            )}
          </div>
          <dl className={styles.facts}>
            <div>
              <dt>{t.card.degree}</dt>
              <dd>
                <ArrowLink href={profile.universityUrl} icon={null}>
                  {localize(profile.degree)} · {profile.university}
                </ArrowLink>
              </dd>
            </div>
            <div>
              <dt>{t.card.location}</dt>
              <dd>{localize(profile.location)}</dd>
            </div>
            <div>
              <dt>{t.card.email}</dt>
              <dd>
                <ArrowLink href={`mailto:${profile.contact.email}`} icon={null}>
                  {profile.contact.email}
                </ArrowLink>
              </dd>
            </div>
          </dl>
        </motion.aside>

        <div className={styles.content}>
          <motion.div className={styles.text} variants={stagger(0.1)} {...inView}>
            {t.paragraphs.map((paragraph, index) => (
              <motion.p key={index} variants={fadeUp} className={index === 0 ? styles.lead : undefined}>
                {fill(paragraph)}
              </motion.p>
            ))}
          </motion.div>

          <div className={styles.stats}>
            <StatCounter value={years} suffix="+" label={t.stats.years} />
            <StatCounter value={technologyList.length} label={t.stats.technologies} />
            <StatCounter value={certifications.length} label={t.stats.courses} />
          </div>

          <ol className={styles.highlights}>
            {t.highlights.map(({ title, text }, index) => (
              <motion.li key={title} className={styles.highlight} variants={fadeUp} {...inView}>
                <Divider delay={index * 0.1} />
                <span className={styles.highlightIndex}>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  )
}
