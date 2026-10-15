import { useEffect, useState } from 'react'
import { FiArrowUp } from 'react-icons/fi'
import { profile } from '../../data/profile'
import { common } from '../../i18n/common'
import { useTranslation } from '../../i18n/useTranslation'
import { ArrowLink } from '../ArrowLink/ArrowLink'
import { Divider } from '../Divider/Divider'
import { RevealText } from '../RevealText/RevealText'
import { useSmoothScroll } from '../SmoothScroll/useSmoothScroll'
import styles from './Footer.module.css'

const YEAR = new Date().getFullYear()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

const formatTime = (date, lang) =>
  new Intl.DateTimeFormat(lang === 'es' ? 'es-AR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(date)

/** Hora actual de Buenos Aires, actualizada cada 15 segundos. */
function useLocalTime(lang) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(interval)
  }, [])

  return formatTime(now, lang)
}

export function Footer() {
  const { t, lang, localize } = useTranslation(common)
  const { scrollTo } = useSmoothScroll()
  const time = useLocalTime(lang)

  return (
    <footer className={styles.footer}>
      <div className="container">
        <Divider />
        <div className={styles.top}>
          <p className={styles.cta}>{t.footer.cta}</p>
          <ArrowLink href={`mailto:${profile.contact.email}`} className={styles.email}>
            {profile.contact.email}
          </ArrowLink>
        </div>

        <RevealText as="p" className={styles.wordmark} text={profile.fullName} stagger={0.1} />

        <div className={styles.bottom}>
          <div className={styles.column}>
            <span className={styles.label}>{t.footer.localTime}</span>
            <span>
              {time} · {localize(profile.location)}
            </span>
          </div>
          <div className={styles.column}>
            <span className={styles.label}>{t.footer.socials}</span>
            <span className={styles.socials}>
              <ArrowLink href={profile.contact.linkedin}>LinkedIn</ArrowLink>
              <ArrowLink href={profile.contact.github}>GitHub</ArrowLink>
            </span>
          </div>
          <div className={styles.column}>
            <span className={styles.label}>
              © {YEAR} {profile.fullName}
            </span>
            <span className={styles.subtle}>{t.footer.madeWith}</span>
          </div>
          <button type="button" className={styles.backToTop} onClick={() => scrollTo(0)}>
            <span className="link-underline">{t.footer.backToTop}</span>
            <FiArrowUp aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  )
}
