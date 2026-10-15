import { motion } from 'motion/react'
import { FiBookOpen, FiBriefcase, FiCode, FiMail, FiMapPin, FiUsers } from 'react-icons/fi'
import { fadeUp, inView, slideInRight, stagger } from '@/shared/animations/variants'
import { Section, TiltCard } from '@/shared/components'
import { profile } from '@/shared/data/profile'
import { useYearsCoding } from '@/shared/hooks'
import { useTranslation } from '@/shared/i18n'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { StatCounter } from './StatCounter'
import styles from '../About.module.css'

const HIGHLIGHT_ICONS = [FiCode, FiBriefcase, FiUsers]
const TECHNOLOGIES_COUNT = 10

export function About() {
  const { t, localize } = useTranslation({ es, en })
  const years = useYearsCoding()

  const fill = (text) => text.replace('{name}', profile.fullName).replace('{years}', years)

  return (
    <Section id="about" index="01" eyebrow={t.eyebrow} title={t.title}>
      <div className={styles.grid}>
        <motion.div className={styles.text} variants={stagger(0.12)} {...inView}>
          {t.paragraphs.map((paragraph, index) => (
            <motion.p key={index} variants={fadeUp} className={index === 0 ? styles.lead : undefined}>
              {fill(paragraph)}
            </motion.p>
          ))}

          <motion.ul className={styles.highlights} variants={stagger(0.1, 0.1)}>
            {t.highlights.map(({ title, text }, index) => {
              const Icon = HIGHLIGHT_ICONS[index]
              return (
                <motion.li key={title} className={styles.highlight} variants={fadeUp} whileHover={{ y: -6 }}>
                  <span className={styles.highlightIcon}>
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </motion.li>
              )
            })}
          </motion.ul>
        </motion.div>

        <motion.div variants={slideInRight} {...inView}>
          <TiltCard className={styles.card} maxTilt={8}>
            <div className={styles.cardTop}>
              <div className={styles.avatar}>
                <span className={styles.avatarRing} aria-hidden="true" />
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.fullName} className={styles.avatarImg} />
                ) : (
                  <span className={`${styles.avatarInitials} gradient-text`}>{profile.initials}</span>
                )}
              </div>
              <div>
                <h3 className={styles.cardName}>{profile.fullName}</h3>
                <p className={styles.cardRole}>{localize(profile.role)}</p>
              </div>
            </div>

            <ul className={styles.info}>
              <li>
                <FiBookOpen aria-hidden="true" />
                <div>
                  <span>{t.card.degree}</span>
                  <a href={profile.universityUrl} target="_blank" rel="noopener noreferrer">
                    {localize(profile.degree)} · {profile.university}
                  </a>
                </div>
              </li>
              <li>
                <FiMapPin aria-hidden="true" />
                <div>
                  <span>{t.card.location}</span>
                  <p>{localize(profile.location)}</p>
                </div>
              </li>
              <li>
                <FiMail aria-hidden="true" />
                <div>
                  <span>{t.card.email}</span>
                  <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
                </div>
              </li>
            </ul>

            <div className={styles.stats}>
              <StatCounter value={years} suffix="+" label={t.stats.years} />
              <StatCounter value={TECHNOLOGIES_COUNT} suffix="+" label={t.stats.technologies} />
              <StatCounter value="360°" label={t.stats.stack} />
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </Section>
  )
}
