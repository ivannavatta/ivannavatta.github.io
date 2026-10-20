import { useCallback, useRef } from 'react'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useScroll } from '@/shared/scroll'
import { CHAPTERS, MOBILE_QUERY } from '@/shared/stage'
import { externalLinkProps } from '@/shared/utils/externalLinkProps'
import { NAV_CHANNELS, NAV_SECTIONS } from '../data/sections'
import { useChapterProgress } from '../hooks/useChapterProgress'
import { useMobileMenu } from '../hooks/useMobileMenu'
import { useNavVisibility } from '../hooks/useNavVisibility'
import { useSurfaceTheme } from '../hooks/useSurfaceTheme'
import { copy } from '../i18n'
import { BurgerIcon } from './BurgerIcon'
import { LogoMark } from './LogoMark'
import styles from './Navbar.module.css'

const cx = (...names) => names.filter(Boolean).join(' ')

/**
 * Nav-circuito: el IN es el chip, anclado a la izquierda; las secciones son pads de un bloque
 * centrado en la página, unidos por una traza que se enciende con la lectura.
 * En mobile: barra fija (chip, traza de avance y botón Menú) y un panel donde la traza
 * baja del chip y los pads cuelgan de ella.
 */
export function Navbar() {
  const headerRef = useRef(null)
  const logoRef = useRef(null)
  const toggleRef = useRef(null)
  const leadRef = useRef(null)
  const wireRefs = useRef([])
  const mobile = useMediaQuery(MOBILE_QUERY)
  const { scrollTo } = useScroll()

  useSurfaceTheme(headerRef, styles.isFlip)
  const hidden = useNavVisibility(headerRef, { pinned: mobile })
  const chapter = useChapterProgress({ headerRef, leadRef, wireRefs, mobile, litClass: styles.isLit })
  const { open, setMenu, panelRef } = useMobileMenu({ headerRef, logoRef, toggleRef, mobile, flipClass: styles.isFlip })
  const chapterIndex = CHAPTERS.indexOf(chapter)

  // Con el menú abierto, un link interno primero cierra, el foco va ya al título de destino
  // (el link desaparece) y después se desplaza. Cerrado, lo maneja el ScrollProvider.
  const onInternalLink = useCallback(
    (event) => {
      if (!open) return
      event.preventDefault()
      setMenu(false, { returnFocus: false })
      scrollTo(event.currentTarget.getAttribute('href'), { focusNow: true })
    },
    [open, setMenu, scrollTo],
  )
  const onChannel = useCallback(() => setMenu(false), [setMenu])

  return (
    <header
      ref={headerRef}
      className={cx(styles.top, hidden && styles.isHidden, open && styles.isOpen)}
      data-nav-state={hidden ? 'hidden' : 'visible'}
    >
      <div className={styles.board}>
        <a
          ref={logoRef}
          className={styles.logo}
          href="#inicio"
          aria-label={copy.nav.home}
          aria-current={chapter === CHAPTERS[0] ? 'location' : undefined}
          onClick={onInternalLink}
        >
          <LogoMark accentClass={styles.logoAccent} />
        </a>
        <span className={styles.lead} aria-hidden="true">
          <span className={styles.wire} ref={leadRef}>
            <i />
          </span>
        </span>

        <button
          ref={toggleRef}
          className={styles.toggle}
          type="button"
          aria-expanded={open}
          aria-controls="menu"
          aria-label={open ? copy.nav.closeMenu : copy.nav.openMenu}
          onClick={() => setMenu(!open)}
        >
          <BurgerIcon className={styles.burger} />
          <span className={styles.toggleLabel} aria-hidden="true">
            <span>{copy.nav.menu}</span>
            <span>{copy.nav.close}</span>
          </span>
        </button>

        {/* En escritorio esta caja no existe (display: contents); en mobile es el panel del menú.
            Oculta, la nav es inerte salvo el IN: es el primer stop de Tab, y al recibir foco de
            teclado la cabecera aparece y se libera el resto. */}
        <div className={styles.panel} id="menu" ref={panelRef} inert={hidden || undefined}>
          <nav className={styles.nav} aria-label={copy.nav.sections}>
            <ul>
              {NAV_SECTIONS.map(({ id, cta }, i) => {
                const label = copy.sectionLabels[id]
                return (
                  <li key={id} className={cx(cta && styles.end, i + 1 <= chapterIndex && styles.isOn)}>
                    <span
                      className={styles.wire}
                      aria-hidden="true"
                      ref={(el) => {
                        wireRefs.current[i] = el
                      }}
                    >
                      <i />
                    </span>
                    <a
                      href={`#${id}`}
                      className={cta ? styles.cta : undefined}
                      aria-current={chapter === id ? 'location' : undefined}
                      onClick={onInternalLink}
                    >
                      {cta ? (
                        label
                      ) : (
                        <span className={styles.label} data-label={label}>
                          {label}
                        </span>
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
          <ul className={styles.extra} aria-label={copy.nav.channels}>
            {NAV_CHANNELS.map(({ id, href, external, download }) => {
              const label = copy.channelLabels[id]
              return (
                <li key={id}>
                  <a
                    href={href}
                    {...(external ? externalLinkProps(href) : {})}
                    {...(download ? { download: true } : {})}
                    onClick={onChannel}
                  >
                    {label}
                    {download && <span className={styles.extraNote}> {copy.nav.pdf}</span>}
                    {/* El nombre accesible empieza con el texto visible (WCAG 2.5.3) */}
                    {external && <span className="sr-only"> {copy.nav.newTab}</span>}
                    {download && <span className="sr-only">{copy.nav.cvHint}</span>}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </header>
  )
}
