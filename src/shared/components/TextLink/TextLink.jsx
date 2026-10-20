import { externalLinkProps } from '../../utils/externalLinkProps'
import styles from './TextLink.module.css'

/**
 * Link de texto subrayado, con área táctil de 44 px. Los externos llevan target y rel seguros
 * (externalLinkProps va al final: ningún caller puede pisarlos).
 * Para un link externo, sumá en children un aviso sr-only "(se abre en otra pestaña)".
 */
export function TextLink({ href, children, className, ...props }) {
  return (
    <a
      href={href}
      className={className ? `${styles.link} ${className}` : styles.link}
      {...props}
      {...externalLinkProps(href)}
    >
      {children}
    </a>
  )
}
