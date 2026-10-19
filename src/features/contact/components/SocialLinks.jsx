import { useEffect, useRef, useState } from 'react'
import { FiArrowUpRight, FiCheck, FiCopy } from 'react-icons/fi'
import { profile } from '@/shared/data/profile'
import { externalLinkProps } from '@/shared/utils/externalLinkProps'
import styles from '../Contact.module.css'

/** Lista de contacto: copiar email, LinkedIn, GitHub y ubicación. */
export function SocialLinks({ t, localize }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef(null)

  // Si el componente se desmonta antes de los 2 s, cancelamos el timeout pendiente
  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.contact.email)
      setCopied(true)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${profile.contact.email}`
    }
  }

  const links = [
    { id: 'linkedin', label: t.links.linkedin, href: profile.contact.linkedin },
    { id: 'github', label: t.links.github, href: profile.contact.github },
  ]

  return (
    <ul className={styles.links}>
      <li>
        <button type="button" className={styles.linkRow} onClick={copyEmail}>
          <span>{copied ? t.links.copied : t.links.copy}</span>
          {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
        </button>
      </li>
      {links.map(({ id, label, href }) => (
        <li key={id}>
          <a href={href} {...externalLinkProps(href)} className={styles.linkRow}>
            <span>{label}</span>
            <FiArrowUpRight aria-hidden="true" />
          </a>
        </li>
      ))}
      <li className={styles.linkRow}>
        <span className={styles.subtle}>{t.links.location}</span>
        <span>{localize(profile.location)}</span>
      </li>
    </ul>
  )
}
