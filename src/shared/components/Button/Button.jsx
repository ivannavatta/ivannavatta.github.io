import styles from './Button.module.css'

/**
 * Botón sobrio. Se renderiza como <a> si recibe `href`, si no como <button>.
 * variant: 'primary' (tinta sólida) | 'ghost' (contorno)
 */
export function Button({ children, href, variant = 'primary', size = 'md', icon, className = '', ...props }) {
  const Component = href ? 'a' : 'button'
  const linkProps = href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <Component
      href={href}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...linkProps}
      {...props}
    >
      <span className={styles.label}>{children}</span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </Component>
  )
}
