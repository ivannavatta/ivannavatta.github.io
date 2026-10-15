import { motion } from 'motion/react'
import { FiArrowUpRight, FiAward, FiClock } from 'react-icons/fi'
import { fadeUp, inView, stagger } from '@/shared/animations/variants'
import { TiltCard } from '@/shared/components'
import { certifications, thumbnail } from '../data/certifications'
import styles from '../Certifications.module.css'

const TOTAL_HOURS = certifications.reduce((sum, course) => sum + course.hours, 0)

export function Certifications({ t, lang, localize }) {
  const formatDate = (date) =>
    new Intl.DateTimeFormat(lang === 'es' ? 'es-AR' : 'en-US', { month: 'short', year: 'numeric' }).format(
      new Date(`${date}T12:00:00`),
    )

  return (
    <div className={styles.wrapper}>
      <motion.div className={styles.header} variants={fadeUp} {...inView}>
        <h3 className={styles.title}>
          <FiAward aria-hidden="true" /> {t.title}
        </h3>
        <p className={styles.summary}>
          {t.summary.replace('{count}', certifications.length).replace('{hours}', TOTAL_HOURS)}
        </p>
      </motion.div>

      <motion.ul className={styles.grid} variants={stagger(0.1)} {...inView}>
        {certifications.map((course) => {
          const title = localize(course.title)
          return (
            <motion.li key={course.id} variants={fadeUp}>
              <TiltCard className={styles.card} maxTilt={7}>
                <a
                  href={course.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                  data-cursor={t.cursor}
                  aria-label={`${t.view}: ${title} (${course.issuer})`}
                >
                  <span className={styles.thumb}>
                    <img src={thumbnail(course.image)} alt="" loading="lazy" />
                    <span className={styles.overlay}>
                      {t.view} <FiArrowUpRight />
                    </span>
                    {course.badge && <span className={styles.badge}>{course.badge}</span>}
                  </span>
                  <span className={styles.body}>
                    <span className={styles.issuer}>
                      {course.issuer} · {formatDate(course.date)}
                    </span>
                    <strong className={styles.course}>{title}</strong>
                    <span className={styles.meta}>
                      <FiClock aria-hidden="true" /> {course.hours} {t.hours} · {course.weeks} {t.weeks}
                    </span>
                  </span>
                </a>
              </TiltCard>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}
