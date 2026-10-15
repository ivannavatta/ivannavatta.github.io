import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { profile } from '@/shared/data/profile'
import { useSmoothScroll } from '@/shared/hooks'
import { useTranslation } from '@/shared/i18n'
import { useActiveSection } from '../hooks/useActiveSection'
import { useScrollDirection } from '../hooks/useScrollDirection'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { SECTIONS } from '../sections'
import { LanguageToggle } from './LanguageToggle'
import { MobileMenu } from './MobileMenu'
import { ScrollProgress } from './ScrollProgress'
import styles from '../Navbar.module.css'

export function Navbar() {
  const { t } = useTranslation({ es, en })
  const { scrollTo, lockScroll, unlockScroll } = useSmoothScroll()
  const active = useActiveSection(SECTIONS)
  const { scrolled, hidden } = useScrollDirection()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (menuOpen) lockScroll()
    else unlockScroll()
  }, [menuOpen, lockScroll, unlockScroll])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const navigate = (event, id) => {
    event.preventDefault()
    // Si el menú mobile estaba abierto, liberamos el scroll antes de desplazarnos
    if (menuOpen) {
      unlockScroll()
      setMenuOpen(false)
    }
    scrollTo(id === 'home' ? 0 : `#${id}`)
  }

  return (
    <>
      <ScrollProgress />
      <motion.header
        className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}
        initial={{ y: -100 }}
        animate={{ y: hidden && !menuOpen ? -100 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`container ${styles.inner}`}>
          <a href="#home" className={styles.logo} onClick={(event) => navigate(event, 'home')} aria-label={t.goHome}>
            {profile.fullName}
            <span className={styles.logoDot} aria-hidden="true" />
          </a>

          <nav className={styles.links} aria-label="Principal">
            {SECTIONS.filter((id) => id !== 'home').map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className={`${styles.link} ${active === id ? styles.linkActive : ''}`}
                onClick={(event) => navigate(event, id)}
                aria-current={active === id ? 'true' : undefined}
              >
                <span className={styles.activeDot} aria-hidden="true" />
                <span className="link-underline">{t.links[id]}</span>
              </a>
            ))}
          </nav>

          <div className={styles.actions}>
            <LanguageToggle className={styles.desktopOnly} />
            <button
              type="button"
              className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? t.closeMenu : t.openMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? t.close : t.menu}
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu open={menuOpen} sections={SECTIONS} labels={t.links} active={active} onNavigate={navigate} />
    </>
  )
}
