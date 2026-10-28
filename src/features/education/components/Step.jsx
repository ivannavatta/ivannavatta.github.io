import { useState } from 'react'
import { Button } from '@/shared/components/Button/Button'
import { blockProps } from '@/shared/stage'
import { copy } from '../i18n'
import styles from './Education.module.css'

/**
 * Un paso del recorrido. Los cursos llevan su columna de bloques (decorativa: la escena 3D la
 * dibuja) y "Ver certificado", que despliega la miniatura: en escritorio flota sobre la columna,
 * en tablet y mobile se abre debajo del botón. La imagen se pide recién cuando hace falta
 * (al abrir, enfocar el botón o pasar el cursor), no con la página.
 */
export function Step({ step, open, onToggle, onEnter, onLeave }) {
  const t = copy.education
  const c = copy.steps[step.id]
  const [requested, setRequested] = useState(false)
  const isCourse = step.kind === 'course'
  const hasCert = isCourse && Boolean(step.image)
  const certId = `cert-${step.id}`

  // Estado derivado durante el render (patrón de React): una vez pedida, la imagen queda
  if (open && !requested) setRequested(true)
  const request = () => setRequested(true)

  return (
    <li
      className={isCourse ? styles.step : `${styles.step} ${styles.now}`}
      style={isCourse ? { '--blocks': step.blocks } : undefined}
      // Solo el mouse: en equipos híbridos un toque también dispara pointerenter
      onPointerEnter={hasCert && onEnter ? (e) => e.pointerType === 'mouse' && onEnter() : undefined}
      onPointerLeave={hasCert && onLeave ? (e) => e.pointerType === 'mouse' && onLeave() : undefined}
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
      {hasCert && (
        <>
          <Button
            variant="quiet"
            className={styles.certButton}
            aria-expanded={open}
            aria-controls={certId}
            onClick={onToggle}
            onFocus={request}
          >
            {t.showCert}
            <span className="sr-only">: {c.what}</span>
          </Button>
          <figure className={styles.cert} id={certId} hidden={!open}>
            {requested && <img src={step.image} alt={t.certAlt(c.what)} width="480" height="311" decoding="async" />}
            <figcaption>{t.certCaption(c.what)}</figcaption>
          </figure>
        </>
      )}
    </li>
  )
}
