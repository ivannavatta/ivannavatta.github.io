import { FiArrowUpRight } from 'react-icons/fi'
import { externalLinkProps } from '../../utils/externalLinkProps'
import styles from './ArrowLink.module.css'

/** Link de texto con subrayado que crece y flecha que se desplaza al pasar el mouse. */
export function ArrowLink({ href, children, icon = <FiArrowUpRight />, className = '', ...props }) {
  return (
    <a
      href={href}
      className={`${styles.link} ${className}`}
      {...props}
      {...externalLinkProps(href)}
    >
      <span className="link-underline">{children}</span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </a>
  )
}
