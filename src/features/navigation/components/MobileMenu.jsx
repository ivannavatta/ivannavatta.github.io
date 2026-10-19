import { AnimatePresence, motion } from 'motion/react'
import { useMemo } from 'react'
import { EASE_OUT } from '@/shared/animations/variants'
import { ArrowLink } from '@/shared/components'
import { profile } from '@/shared/data/profile'
import { useFocusTrap } from '@/shared/hooks'
import { LanguageToggle } from './LanguageToggle'
import styles from '../Navbar.module.css'

const panel = {
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  visible: {
    clipPath: 'inset(0 0 0% 0)',
    transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], staggerChildren: 0.06, delayChildren: 0.3 },
  },
  exit: { clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] } },
}

const item = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 0.8, ease: EASE_OUT } },
}

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, delay: 0.5 } },
}

export function MobileMenu({ open, sections, labels, label, navLabel, active, onNavigate, onClose, toggleRef }) {
  // El botón "Cerrar" vive en la navbar: lo sumamos al ciclo de foco del diálogo
  const includeRefs = useMemo(() => [toggleRef], [toggleRef])
  const dialogRef = useFocusTrap(open, { onEscape: onClose, includeRefs })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={styles.mobileMenu}
          variants={panel}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <nav className={styles.mobileNav} aria-label={navLabel}>
            {sections.map((id, index) => (
              <span key={id} className={styles.mobileMask}>
                <motion.a
                  href={`#${id}`}
                  variants={item}
                  className={`${styles.mobileLink} ${active === id ? styles.mobileLinkActive : ''}`}
                  onClick={(event) => onNavigate(event, id)}
                >
                  <span className={styles.mobileIndex}>0{index + 1}</span>
                  {labels[id]}
                </motion.a>
              </span>
            ))}
          </nav>
          <motion.div className={styles.mobileFooter} variants={fade}>
            <LanguageToggle />
            <ArrowLink href={`mailto:${profile.contact.email}`} icon={null}>
              {profile.contact.email}
            </ArrowLink>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
