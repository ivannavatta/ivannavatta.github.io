import { motion } from 'motion/react'
import { FiArrowUp } from 'react-icons/fi'
import { profile } from '../../data/profile'
import { useSmoothScroll } from '../SmoothScroll/useSmoothScroll'
import { common } from '../../i18n/common'
import { useTranslation } from '../../i18n/useTranslation'
import styles from './Footer.module.css'

const YEAR = new Date().getFullYear()

export function Footer() {
  const { t } = useTranslation(common)
  const { scrollTo } = useSmoothScroll()

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={`${styles.logo} gradient-text`}>{profile.initials}.</span>
          <p className={styles.text}>
            © {YEAR} {profile.fullName}. {t.footer.rights}
            <br />
            <span className={styles.subtle}>{t.footer.madeWith}</span>
          </p>
        </div>
        <motion.button
          type="button"
          className={styles.top}
          onClick={() => scrollTo(0)}
          aria-label={t.footer.backToTop}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiArrowUp />
        </motion.button>
      </div>
    </footer>
  )
}
