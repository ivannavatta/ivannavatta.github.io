import { motion } from 'motion/react'
import { useState } from 'react'
import { FiArrowUpRight, FiCheck, FiCopy, FiGithub, FiLinkedin, FiMail, FiMapPin } from 'react-icons/fi'
import { fadeUp, stagger } from '@/shared/animations/variants'
import { profile } from '@/shared/data/profile'
import styles from '../Contact.module.css'

export function SocialLinks({ t, localize }) {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.contact.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${profile.contact.email}`
    }
  }

  const links = [
    {
      id: 'linkedin',
      icon: FiLinkedin,
      label: t.links.linkedin,
      value: `in/${profile.contact.linkedinUser}`,
      href: profile.contact.linkedin,
    },
    {
      id: 'github',
      icon: FiGithub,
      label: t.links.github,
      value: `@${profile.contact.githubUser}`,
      href: profile.contact.github,
    },
  ]

  return (
    <motion.div
      className={styles.links}
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <motion.div className={`${styles.linkCard} ${styles.emailCard}`} variants={fadeUp}>
        <span className={styles.linkIcon}>
          <FiMail />
        </span>
        <a href={`mailto:${profile.contact.email}`} className={styles.linkText}>
          <span>{t.links.email}</span>
          <strong>{profile.contact.email}</strong>
        </a>
        <button type="button" className={styles.copy} onClick={copyEmail} aria-label={t.links.copy}>
          {copied ? <FiCheck /> : <FiCopy />}
          <span className={styles.copyTooltip}>{copied ? t.links.copied : t.links.copy}</span>
        </button>
      </motion.div>

      {links.map(({ id, icon: Icon, label, value, href }) => (
        <motion.a
          key={id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkCard}
          variants={fadeUp}
          whileHover={{ x: 6 }}
        >
          <span className={styles.linkIcon}>
            <Icon />
          </span>
          <span className={styles.linkText}>
            <span>{label}</span>
            <strong>{value}</strong>
          </span>
          <FiArrowUpRight className={styles.arrow} />
        </motion.a>
      ))}

      <motion.div className={styles.linkCard} variants={fadeUp}>
        <span className={styles.linkIcon}>
          <FiMapPin />
        </span>
        <span className={styles.linkText}>
          <span>{t.links.location}</span>
          <strong>{localize(profile.location)}</strong>
        </span>
      </motion.div>
    </motion.div>
  )
}
