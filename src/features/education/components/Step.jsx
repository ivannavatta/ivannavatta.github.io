import { useState } from 'react'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { blockProps } from '@/shared/stage'
import { copy } from '../i18n'
import styles from './Education.module.css'

const FINE_POINTER = '(hover: hover) and (pointer: fine)'

/**
 * Un paso del recorrido. Los cursos llevan su columna de bloques (decorativa: la escena 3D la
 * dibuja) y "Ver certificado", que despliega la miniatura encima del paso. La imagen se pide
 * recién la primera vez que se abre.
 */
export function Step({ step }) {
  const t = copy.education
  const c = copy.steps[step.id]
  const fine = useMediaQuery(FINE_POINTER)
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  const isCourse = step.kind === 'course'
  const certId = `cert-${step.id}`

  const show = (on) => {
    if (on) setRequested(true)
    setOpen(on)
  }

  return (
    <li
      className={isCourse ? styles.step : `${styles.step} ${styles.now}`}
      onPointerEnter={isCourse && fine ? () => show(true) : undefined}
      onPointerLeave={isCourse && fine ? () => show(false) : undefined}
    >
      {isCourse && (
        <div className={styles.bars} aria-hidden="true">
          {Array.from({ length: step.blocks }, (_, i) => {
            const accent = step.accent && i === step.blocks - 1 // el de arriba (columna invertida)
            return <i key={i} className={accent ? styles.barAccent : undefined} {...blockProps({ accent })} />
          })}
        </div>
      )}
      <p className={styles.when}>{isCourse ? `${c.when} · ${t.hours(step.hours)}` : c.when}</p>
      <h3 className={styles.what}>{c.what}</h3>
      <p className={styles.where}>{c.where}</p>
      {isCourse && step.image && (
        <>
          <button
            className={styles.certButton}
            type="button"
            aria-expanded={open}
            aria-controls={certId}
            onClick={() => show(!open)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && open) show(false)
            }}
          >
            {t.showCert}
          </button>
          <figure className={styles.cert} id={certId} hidden={!open}>
            {requested && (
              <img src={step.image} alt={t.certAlt(c.what)} width="480" height="339" decoding="async" />
            )}
            <figcaption>{t.certCaption(c.what)}</figcaption>
          </figure>
        </>
      )}
    </li>
  )
}
