import { useLanguage, useTranslation } from '@/shared/i18n'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import styles from '../Navbar.module.css'

const LANGUAGES = ['es', 'en']

/** Selector de idioma en texto: "ES / EN", con el activo resaltado. */
export function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLanguage()
  const { t } = useTranslation({ es, en })

  return (
    <div className={`${styles.langToggle} ${className}`} role="group" aria-label={t.language}>
      {LANGUAGES.map((code, index) => (
        <span key={code} className={styles.langItem}>
          {index > 0 && (
            <span className={styles.langSeparator} aria-hidden="true">
              /
            </span>
          )}
          <button
            type="button"
            className={`${styles.langOption} ${lang === code ? styles.langActive : ''}`}
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
