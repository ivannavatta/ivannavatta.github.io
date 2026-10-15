import { motion } from 'motion/react'
import { useLanguage, useTranslation } from '@/shared/i18n'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import styles from '../Navbar.module.css'

const LANGUAGES = ['es', 'en']

export function LanguageToggle({ id = 'desktop', className = '' }) {
  const { lang, toggleLang } = useLanguage()
  const { t } = useTranslation({ es, en })

  return (
    <button
      type="button"
      className={`${styles.langToggle} ${className}`}
      onClick={toggleLang}
      aria-label={t.switchLanguage}
    >
      {LANGUAGES.map((code) => (
        <span key={code} className={`${styles.langOption} ${lang === code ? styles.langActive : ''}`}>
          {lang === code && (
            <motion.span
              layoutId={`lang-thumb-${id}`}
              className={styles.langThumb}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className={styles.langLabel}>{code.toUpperCase()}</span>
        </span>
      ))}
    </button>
  )
}
