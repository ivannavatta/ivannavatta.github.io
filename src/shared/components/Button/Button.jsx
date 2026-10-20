import { externalLinkProps } from '../../utils/externalLinkProps'
import styles from './Button.module.css'

// Nombres de la API anterior (features viejas todavía sin migrar): se mapean a los nuevos
const LEGACY_VARIANTS = { primary: 'solid', ghost: 'quiet' }

/**
 * Botón plano, de esquinas rectas. Es un <a> si recibe `href`, si no un <button>.
 * - variant: 'solid' (acento, la acción principal) | 'quiet' (superficie, acción secundaria)
 * - note: aclaración en peso regular dentro del botón (p. ej. "PDF")
 * Los links externos llevan target y rel seguros (externalLinkProps).
 */
export function Button({ children, href, variant = 'solid', note, className, type, ...props }) {
  const tone = styles[LEGACY_VARIANTS[variant] ?? variant] ?? styles.solid
  const classes = [styles.button, tone, className].filter(Boolean).join(' ')
  const content = (
    <>
      {children}
      {note && <span className={styles.note}>{note}</span>}
    </>
  )
  if (href) {
    return (
      // externalLinkProps al final: ningún caller puede pisar target ni rel
      <a href={href} className={classes} {...props} {...externalLinkProps(href)}>
        {content}
      </a>
    )
  }
  return (
    <button type={type ?? 'button'} className={classes} {...props}>
      {content}
    </button>
  )
}
