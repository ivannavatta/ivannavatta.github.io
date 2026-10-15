import { motion } from 'motion/react'
import { inView, slideInLeft, slideInRight } from '@/shared/animations/variants'
import { Section } from '@/shared/components'
import { useTranslation } from '@/shared/i18n'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { ContactForm } from './ContactForm'
import { SocialLinks } from './SocialLinks'
import styles from '../Contact.module.css'

export function Contact() {
  const { t, localize } = useTranslation({ es, en })

  return (
    <Section id="contact" index="05" eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
      <div className={styles.grid}>
        <motion.div className={styles.panel} variants={slideInLeft} {...inView}>
          <ContactForm t={t} />
        </motion.div>

        <motion.aside className={styles.aside} variants={slideInRight} {...inView}>
          <p className={styles.response}>
            <span className={styles.dot} aria-hidden="true" />
            {t.response}
          </p>
          <SocialLinks t={t} localize={localize} />
        </motion.aside>
      </div>
    </Section>
  )
}
