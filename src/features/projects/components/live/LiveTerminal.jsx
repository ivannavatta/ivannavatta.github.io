import { useRef } from 'react'
import { useLiveProgram } from '../../hooks/useLiveProgram'
import { useRevealOnOpen } from '../../hooks/useRevealOnOpen'
import styles from './LiveTerminal.module.css'

const STATE = { loading: 'idle', 'boot-error': 'error', running: 'ready', done: 'idle', error: 'error' }
const STATUS = { loading: 'loading', 'boot-error': 'bootError', running: 'running', done: 'done', error: 'error' }

/**
 * "Probar en vivo": una terminal que corre el programa real de un proyecto (`program`, ver
 * live/programs.js): el main.py con Python en WebAssembly o el Main.java compilado a JavaScript.
 * Ocupa el lugar de la figura, como el panel de arquitectura. Se carga con React.lazy (y con ella
 * el programa) recién cuando se toca el botón; cerrarla la oculta sin perder la sesión.
 * Al abrirse, si no se ve entera, la página se acomoda para mostrarla (useRevealOnOpen).
 */
export default function LiveTerminal({ id, program, copy, hidden, onClose }) {
  const regionRef = useRef(null)
  const termRef = useRef(null)
  const textRef = useRef(null)
  const inputRef = useRef(null)
  const restartRef = useRef(null)
  const { phase, restart, retry, onKeyDown, focusInput, focusIfWaiting } = useLiveProgram({
    program,
    regionRef,
    termRef,
    textRef,
    inputRef,
    restartRef,
    copy,
  })
  // En mobile y tablet se abre debajo del texto: si queda fuera de pantalla, se trae a la vista
  // y, si el programa ya pidió una línea, el input toma el foco al llegar
  useRevealOnOpen({ ref: regionRef, open: !hidden, onRevealed: focusIfWaiting })
  const booted = phase !== 'loading' && phase !== 'boot-error'

  return (
    <div
      ref={regionRef}
      className={styles.live}
      id={id}
      hidden={hidden}
      role="region"
      aria-label={copy.label}
    >
      <div className={styles.bar}>
        <p className={styles.title}>
          <span className={styles.status} data-state={STATE[phase]} aria-hidden="true" />
          <span>{copy.status[STATUS[phase]]}</span>
        </p>
        <div>
          <button ref={restartRef} className={styles.tool} type="button" disabled={!booted} onClick={restart}>
            {copy.restart}
          </button>
          <button className={styles.tool} type="button" onClick={onClose}>
            {copy.close}
          </button>
        </div>
      </div>

      {/* Scroll propio: Lenis no lo toma (data-lenis-prevent) */}
      <div ref={termRef} className={styles.term} data-lenis-prevent aria-busy={phase === 'loading'} onClick={focusInput}>
        {!booted && (
          <div className={styles.loading} data-error={phase === 'boot-error' || undefined}>
            <div className={styles.bricks} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <p role="status">{phase === 'boot-error' ? copy.bootError : copy.loading}</p>
            {phase === 'boot-error' && (
              <button className={styles.tool} type="button" onClick={retry}>
                {copy.retry}
              </button>
            )}
          </div>
        )}
        <div className={styles.out} role="log" aria-label={copy.output} hidden={!booted}>
          <span ref={textRef} />
          <span className={styles.prompt}>
            <input
              ref={inputRef}
              aria-label={copy.answer}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              onKeyDown={onKeyDown}
            />
          </span>
        </div>
      </div>

      <p className={styles.hint}>
        {copy.hints.map((h) => (
          <span key={h.text}>
            {h.text}
            {h.key && (
              <>
                {' '}
                <kbd>{h.key}</kbd>
              </>
            )}
          </span>
        ))}
      </p>
    </div>
  )
}
