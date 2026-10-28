import { useEffect, useRef, useState } from 'react'
import { Button } from '@/shared/components/Button/Button'
import { Monogram } from '@/shared/components/Monogram/Monogram'
import { TextLink } from '@/shared/components/TextLink/TextLink'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useScroll } from '@/shared/scroll'
import { MOBILE_QUERY, POSES, chapterProps } from '@/shared/stage'
import { copy } from '../i18n'
import { Channels } from './Channels'
import { ContactForm } from './ContactForm'
import styles from './Contact.module.css'

const FORM_ID = 'contact-form'
const SCROLL_GAP = 24
const YEAR = new Date().getFullYear() // el del pie: se calcula una vez al cargar

/**
 * Contacto, en una sola pantalla. A la izquierda, el pedido y el IN que vuelve completo (pose
 * "contact"); a la derecha, los canales como pines del chip y el formulario. El pie cierra la
 * misma pantalla. En mobile el formulario se abre a pedido, para que entre lo esencial.
 */
export function Contact() {
  const t = copy.contact
  const mobile = useMediaQuery(MOBILE_QUERY)
  const { refresh, scrollTo } = useScroll()
  const [writing, setWriting] = useState(false)
  const formRef = useRef(null)
  const opened = useRef(false)

  // Al abrir el formulario en mobile: la página creció, se recalculan los disparadores, el foco va
  // al primer campo (sin saltar) y el scroll acompaña hasta el formulario.
  useEffect(() => {
    if (!mobile || !writing || !opened.current) return undefined
    opened.current = false
    const form = formRef.current
    if (!form) return undefined
    refresh()
    form.elements.name?.focus({ preventScroll: true })
    const frame = requestAnimationFrame(() => {
      scrollTo(form.getBoundingClientRect().top + window.scrollY - SCROLL_GAP)
    })
    return () => cancelAnimationFrame(frame)
  }, [mobile, writing, refresh, scrollTo])

  const toggleWriting = () => {
    opened.current = !writing
    setWriting(!writing)
    if (writing) requestAnimationFrame(refresh)
  }

  return (
    <section {...chapterProps('contacto', 'dark')} className={styles.contact} aria-labelledby="contact-title">
      <div className={styles.grid}>
        <div className={styles.say}>
          <h2 className={styles.title} id="contact-title">
            {t.title}
          </h2>
          <Monogram pose={POSES.contact} className={styles.mono} />
          <p className={styles.lead}>{t.lead}</p>
          <p className={styles.text}>{t.text}</p>
        </div>
        <div className={styles.reach}>
          <Channels />
          {mobile && (
            <Button
              variant="quiet"
              className={styles.write}
              aria-expanded={writing}
              aria-controls={FORM_ID}
              onClick={toggleWriting}
            >
              {writing ? t.hideForm : t.write}
            </Button>
          )}
          <ContactForm id={FORM_ID} formRef={formRef} hidden={mobile && !writing} />
        </div>
      </div>
      <footer className={styles.foot}>
        <p>{t.footer(YEAR)}</p>
        <TextLink href="#inicio" className={styles.top}>
          {t.backToTop}
        </TextLink>
      </footer>
    </section>
  )
}
