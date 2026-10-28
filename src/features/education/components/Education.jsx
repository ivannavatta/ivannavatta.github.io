import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { POSES, announceStageLayout, chapterProps, poseProps } from '@/shared/stage'
import { STEPS } from '../data/steps'
import { copy } from '../i18n'
import { Step } from './Step'
import styles from './Education.module.css'

// Vista previa al pasar el cursor solo en escritorio: ahí el certificado flota sobre el paso.
// Por debajo de 1024 px se abre dentro del flujo y, con hover, correría el contenido bajo el cursor.
const HOVER_PREVIEW = '(hover: hover) and (pointer: fine) and (min-width: 1024px)'
// Intención: el cursor tiene que quedarse un momento sobre el paso. Así no se abren certificados
// al pasar de largo o mientras la rueda desplaza la lista bajo un cursor quieto. Salir es inmediato.
const HOVER_INTENT_MS = 200

/**
 * Un solo certificado visible a la vez.
 * - pinned: el que se abrió con el botón (clic, Enter o Espacio).
 * - hover:  el paso bajo el cursor (vista previa en escritorio).
 * - muted:  el paso bajo el cursor que se cerró a propósito (botón o Escape): no se reabre
 *           hasta que el cursor salga del paso.
 */
const CLOSED = { pinned: null, hover: null, muted: null }

const visibleCert = (s) => (s.hover && s.hover !== s.muted ? s.hover : s.pinned)

function certReducer(s, action) {
  switch (action.type) {
    case 'enter':
      return { pinned: s.pinned === action.id ? s.pinned : null, hover: action.id, muted: null }
    case 'leave':
      return s.hover === action.id ? { ...s, hover: null, muted: null } : s
    case 'toggle':
      if (visibleCert(s) === action.id) return { ...s, pinned: null, muted: s.hover }
      return { ...s, pinned: action.id, muted: s.hover && s.hover !== action.id ? s.hover : null }
    case 'close':
      return { ...s, pinned: null, muted: s.hover }
    default:
      return s
  }
}

/**
 * Recorrido: cuatro cursos y la carrera en curso, en una lista ordenada. Cada curso tiene su
 * columna de bloques (uno cada ~10 h); la escena 3D arma ahí la pose "path" del IN. La carrera
 * no suma bloques: los 19 de los cursos son las 19 piezas del IN.
 */
export function Education() {
  const t = copy.education
  const preview = useMediaQuery(HOVER_PREVIEW)
  const [certs, dispatch] = useReducer(certReducer, CLOSED)
  // Si la ventana deja de admitir la vista previa (se achica), el hover que quedó no cuenta
  const visible = visibleCert(preview ? certs : { ...certs, hover: null })

  const intent = useRef(0)
  const enter = useCallback((id) => {
    clearTimeout(intent.current)
    intent.current = setTimeout(() => dispatch({ type: 'enter', id }), HOVER_INTENT_MS)
  }, [])
  const leave = useCallback((id) => {
    clearTimeout(intent.current)
    dispatch({ type: 'leave', id })
  }, [])
  useEffect(() => () => clearTimeout(intent.current), [])

  // Escape cierra el certificado visible desde cualquier lugar (también la vista previa del
  // cursor, que no tiene foco: WCAG 1.4.13). No se frena el evento: otros diálogos lo siguen viendo.
  useEffect(() => {
    if (!visible) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') dispatch({ type: 'close' })
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible])

  // En tablet y mobile el certificado se abre en el flujo y corre los bloques de los pasos
  // siguientes. Se avisa cuando la lista cambia de tamaño de verdad (ResizeObserver, sin espera):
  // al abrir es enseguida, y al cerrar recién cuando termina la salida (display allow-discrete).
  // Así la escena 3D vuelve a medir en el cuadro siguiente, con o sin movimiento reducido.
  const listRef = useRef(null)
  useEffect(() => {
    const list = listRef.current
    if (!list || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => announceStageLayout())
    observer.observe(list)
    return () => observer.disconnect()
  }, [])

  // La columna más alta define la fila de bloques: su certificado no entra arriba y va al costado
  const tallest = Math.max(...STEPS.map((step) => step.blocks ?? 0))

  return (
    <section {...chapterProps('recorrido', 'light')} className={styles.path} aria-labelledby="path-title">
      <div className={styles.head}>
        <h2 className={styles.title} id="path-title">
          {t.title}
        </h2>
        <p className={styles.lead}>{t.lead}</p>
      </div>
      <ol ref={listRef} className={styles.list} {...poseProps(POSES.path)}>
        {STEPS.map((step) => (
          <Step
            key={step.id}
            step={step}
            certBeside={step.blocks === tallest}
            open={visible === step.id}
            onToggle={() => dispatch({ type: 'toggle', id: step.id })}
            onEnter={preview ? () => enter(step.id) : undefined}
            onLeave={preview ? () => leave(step.id) : undefined}
          />
        ))}
      </ol>
    </section>
  )
}
