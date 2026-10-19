import { motion } from 'motion/react'
import { FiArrowDown, FiArrowRight, FiDownload } from 'react-icons/fi'
import { EASE_OUT } from '@/shared/animations/variants'
import { Button, RevealText } from '@/shared/components'
import { profile } from '@/shared/data/profile'
import { useSmoothScroll, useYearsCoding } from '@/shared/hooks'
import { useTranslation } from '@/shared/i18n'
import { toSegments } from '@/shared/utils/segments'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { CodeBlock } from './CodeBlock'
import styles from '../Hero.module.css'

const fade = (delay) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, ease: EASE_OUT, delay },
})

export function Hero() {
  const { t, localize } = useTranslation({ es, en })
  const { scrollTo } = useSmoothScroll()
  const years = useYearsCoding()

  const goToProjects = (event) => {
    event.preventDefault()
    scrollTo('#projects')
  }

  return (
    <section id="home" className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <motion.div className={styles.topLine} {...fade(0.1)}>
          {profile.availableForWork && (
            <span className={styles.available}>
              <span className={styles.pulse} aria-hidden="true" />
              {t.available}
            </span>
          )}
          <span className={styles.location}>{localize(profile.location)}</span>
        </motion.div>

        <RevealText as="h1" className={styles.name} text={profile.fullName} animate delay={0.2} stagger={0.12} />

        <div className={styles.grid}>
          <div>
            <RevealText as="p" className={styles.role} text={toSegments(t.role)} animate delay={0.55} stagger={0.04} />

            <motion.p className={styles.description} {...fade(0.9)}>
              {t.descriptionStart} {localize(profile.degree)} ({profile.university}). {t.descriptionEnd}
            </motion.p>

            <motion.div className={styles.ctas} {...fade(1.05)}>
              <Button href="#projects" onClick={goToProjects} icon={<FiArrowRight />}>
                {t.ctaProjects}
              </Button>
              {profile.cvUrl && (
                <Button
                  href={profile.cvUrl}
                  download={`${profile.fullName.replace(' ', '-')}-CV.pdf`}
                  variant="ghost"
                  icon={<FiDownload />}
                >
                  {t.ctaCv}
                </Button>
              )}
            </motion.div>

            <motion.p className={styles.meta} {...fade(1.2)}>
              <strong>{years}+</strong> {t.yearsCoding}
            </motion.p>
          </div>

          <motion.div className={styles.codeWrapper} {...fade(0.8)}>
            <CodeBlock label={t.codeLabel} />
          </motion.div>
        </div>

        <motion.a
          href="#about"
          className={styles.scrollHint}
          onClick={(event) => {
            event.preventDefault()
            scrollTo('#about')
          }}
          {...fade(1.4)}
        >
          <span className={styles.scrollLine} aria-hidden="true" />
          {t.scroll} <FiArrowDown aria-hidden="true" />
        </motion.a>
      </div>
    </section>
  )
}
