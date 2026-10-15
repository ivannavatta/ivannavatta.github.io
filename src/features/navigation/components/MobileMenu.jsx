import { AnimatePresence, motion } from 'motion/react'
import { FiGithub, FiLinkedin, FiMail } from 'react-icons/fi'
import { profile } from '@/shared/data/profile'
import { EASE_OUT } from '@/shared/animations/variants'
import { LanguageToggle } from './LanguageToggle'
import styles from '../Navbar.module.css'

const overlay = {
  hidden: { clipPath: 'circle(0% at calc(100% - 40px) 36px)' },
  visible: {
    clipPath: 'circle(150% at calc(100% - 40px) 36px)',
    transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], staggerChildren: 0.06, delayChildren: 0.25 },
  },
  exit: {
    clipPath: 'circle(0% at calc(100% - 40px) 36px)',
    transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
}

export function MobileMenu({ open, sections, labels, active, onNavigate }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          className={styles.mobileMenu}
          variants={overlay}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <nav className={styles.mobileNav}>
            {sections.map((id, index) => (
              <motion.a
                key={id}
                href={`#${id}`}
                variants={item}
                className={`${styles.mobileLink} ${active === id ? styles.mobileLinkActive : ''}`}
                onClick={(event) => onNavigate(event, id)}
              >
                <span className={styles.mobileIndex}>0{index + 1}</span>
                {labels[id]}
              </motion.a>
            ))}
          </nav>
          <motion.div className={styles.mobileFooter} variants={item}>
            <LanguageToggle id="mobile" />
            <div className={styles.mobileSocials}>
              <a href={`mailto:${profile.contact.email}`} aria-label="Email">
                <FiMail />
              </a>
              <a href={profile.contact.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FiLinkedin />
              </a>
              <a href={profile.contact.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <FiGithub />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
