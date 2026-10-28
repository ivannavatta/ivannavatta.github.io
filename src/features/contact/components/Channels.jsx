import { Button } from '@/shared/components/Button/Button'
import { externalLinkProps } from '@/shared/utils/externalLinkProps'
import { CHANNELS } from '../data/channels'
import { useCopyEmail } from '../hooks/useCopyEmail'
import { copy } from '../i18n'
import styles from './Contact.module.css'

/**
 * Canales como pines del chip: pad, nombre y valor. El valor es el link.
 * Sin aria-label: el nombre accesible es el texto visible ("Email ivannavatta@gmail.com") más,
 * en los externos, "(se abre en otra pestaña)" al final (WCAG 2.5.3, label in name).
 */
export function Channels() {
  const email = CHANNELS.find((c) => c.copy)
  const { state, copy: copyEmail } = useCopyEmail(email.copy)
  const t = copy.copyEmail

  return (
    <>
      <ul className={styles.pins} aria-label={copy.contact.channels}>
        {CHANNELS.map((channel) => {
          const c = copy.channels[channel.id]
          return (
            <li key={channel.id} className={channel.copy ? `${styles.pin} ${styles.pinMail}` : styles.pin}>
              <a
                className={styles.pinLink}
                href={channel.href}
                {...(channel.external ? externalLinkProps(channel.href) : {})}
                {...(channel.download ? { download: '' } : {})}
              >
                <span className={styles.pinLabel}>{c.label}</span>{' '}
                <span className={styles.pinValue}>{channel.value ?? c.value}</span>
                {channel.external && <span className="sr-only"> {copy.contact.newTab}</span>}
              </a>
              {channel.copy && (
                <Button
                  variant="quiet"
                  className={state === 'done' ? `${styles.copy} ${styles.copyDone}` : styles.copy}
                  onClick={copyEmail}
                >
                  {t[state]}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      <p className="sr-only" role="status">
        {state === 'done' && t.announceDone}
        {state === 'failed' && t.announceFailed(email.copy)}
      </p>
    </>
  )
}
