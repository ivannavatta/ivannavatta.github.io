import { motion } from 'motion/react'
import { FiArrowUpRight } from 'react-icons/fi'
import { fadeUp, inView, stagger } from '@/shared/animations/variants'
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
        <h3 className={styles.title}>{t.title}</h3>
        <p className={styles.summary}>
          {t.summary.replace('{count}', certifications.length).replace('{hours}', TOTAL_HOURS)}
        </p>
      </motion.div>

      <motion.ul className={styles.grid} variants={stagger(0.08)} {...inView}>
        {certifications.map((course) => {
          const title = localize(course.title)
          return (
            <motion.li key={course.id} variants={fadeUp}>
              <a
                href={course.image}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.card}
                aria-label={`${t.view}: ${title} (${course.issuer})`}
              >
                <span className={styles.thumb}>
                  <img src={thumbnail(course.image)} alt="" loading="lazy" />
                  {course.badge && <span className={styles.badge}>{course.badge}</span>}
                </span>
                <span className={styles.caption}>
                  <span className={styles.course}>
                    {title}
                    <FiArrowUpRight className={styles.arrow} aria-hidden="true" />
                  </span>
                  <span className={styles.meta}>
                    {course.issuer} · {formatDate(course.date)} · {course.hours} {t.hours}
                  </span>
                </span>
              </a>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}
