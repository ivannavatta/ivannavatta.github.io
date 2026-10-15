import { motion } from 'motion/react'
import { fadeUp, inView } from '@/shared/animations/variants'
import { Section } from '@/shared/components'
import { profile } from '@/shared/data/profile'
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
        <motion.aside className={styles.aside} variants={fadeUp} {...inView}>
          <p className={styles.response}>
            <span className={styles.dot} aria-hidden="true" />
            {t.response}
          </p>
          <p className={styles.asideTitle}>{t.socialsTitle}</p>
          <SocialLinks t={t} localize={localize} />
        </motion.aside>

        <div className={styles.main}>
          <motion.div variants={fadeUp} {...inView}>
            <p className={styles.label}>{t.emailLabel}</p>
            <a href={`mailto:${profile.contact.email}`} className={styles.bigEmail}>
              <span className="link-underline">{profile.contact.email}</span>
            </a>
          </motion.div>

          <motion.div className={styles.formBlock} variants={fadeUp} {...inView}>
            <p className={styles.label}>{t.formTitle}</p>
            <ContactForm t={t} />
          </motion.div>
        </div>
      </div>
    </Section>
  )
}
