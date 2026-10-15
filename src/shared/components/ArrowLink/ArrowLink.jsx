import { FiArrowUpRight } from 'react-icons/fi'
import styles from './ArrowLink.module.css'

/** Link de texto con subrayado que crece y flecha que se desplaza al pasar el mouse. */
export function ArrowLink({ href, children, icon = <FiArrowUpRight />, className = '', ...props }) {
  const external = href?.startsWith('http')
  return (
    <a
      href={href}
      className={`${styles.link} ${className}`}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    >
      <span className="link-underline">{children}</span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </a>
  )
}
