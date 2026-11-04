import { lazy, Suspense, useRef, useState } from 'react'
import { TextLink } from '@/shared/components/TextLink/TextLink'
import { useRevealOnOpen } from '../hooks/useRevealOnOpen'
import { copy } from '../i18n'
import { CaseFigure } from './figures/CaseFigure'
import styles from './Projects.module.css'

// La terminal en vivo (y con ella el programa) se descarga recién cuando se va a usar: el bundle
// inicial no crece. Pasar el cursor o el foco por el botón ya adelanta el JS del componente.
const loadLiveTerminal = () => import('./live/LiveTerminal')
const LiveTerminal = lazy(loadLiveTerminal)

/**
 * Un caso: título, año y tipo, problema, rol, stack y links. A la derecha, su figura;
 * "Ver arquitectura" la cambia, en el mismo lugar, por la arquitectura y las decisiones, y en los
 * casos con `live`, "Probar en vivo" la cambia por una terminal que corre el programa real.
 * Los dos botones se excluyen entre sí (comparten el estado, cada uno con su aria-expanded).
 */
export function ProjectCase({ project, caseRef }) {
  const [view, setView] = useState(null) // null | 'arch' | 'live'
  const [liveMounted, setLiveMounted] = useState(false)
  const liveButtonRef = useRef(null)
  const panelRef = useRef(null)
  const t = copy.projects
  const c = copy.cases[project.id]
  const titleId = `t-${project.id}`
  const panelId = `more-${project.id}`
  const liveId = `live-${project.id}`
  const archOpen = view === 'arch'
  const liveOpen = view === 'live'
  // En mobile el panel se abre debajo del texto: si queda fuera de pantalla, se trae a la vista
  useRevealOnOpen({ ref: panelRef, open: archOpen })

  const toggleLive = () => {
    setLiveMounted(true)
    setView((v) => (v === 'live' ? null : 'live'))
  }
  const closeLive = () => {
    setView(null)
    liveButtonRef.current?.focus()
  }

  return (
    <article ref={caseRef} className={styles.case} id={`case-${project.id}`} aria-labelledby={titleId}>
      <div className={styles.body}>
        <h3 className={styles.caseTitle} id={titleId}>
          {c.title}
        </h3>
        <p className={styles.meta}>{c.meta}</p>
        <dl className={styles.facts}>
          <div>
            <dt>{t.facts.problem}</dt>
            <dd>{c.problem}</dd>
          </div>
          <div>
            <dt>{t.facts.role}</dt>
            <dd>{c.role}</dd>
          </div>
          <div>
            <dt>{t.facts.stack}</dt>
            <dd>{c.stack}</dd>
          </div>
        </dl>
        <div className={styles.links}>
          {project.links.map((link) => (
            <TextLink key={link.key} href={link.href}>
              {t.links[link.key]}
              <span className="sr-only"> {t.newTab}</span>
            </TextLink>
          ))}
          <div className={styles.buttons}>
            {project.live && (
              <button
                ref={liveButtonRef}
                className={styles.more}
                type="button"
                aria-expanded={liveOpen}
                // Solo apunta a la terminal cuando existe (se monta al primer uso)
                aria-controls={liveMounted ? liveId : undefined}
                onClick={toggleLive}
                onPointerEnter={loadLiveTerminal}
                onFocus={loadLiveTerminal}
              >
                <span className={styles.dot} aria-hidden="true" />
                {t.live}
              </button>
            )}
            <button
              className={styles.more}
              type="button"
              aria-expanded={archOpen}
              aria-controls={panelId}
              onClick={() => setView((v) => (v === 'arch' ? null : 'arch'))}
            >
              {archOpen ? t.less : t.more}
            </button>
          </div>
        </div>
      </div>
      <div className={styles.side} data-open={view ? true : undefined}>
        <CaseFigure kind={project.figure} copy={c.figure} id={project.id} />
        <div ref={panelRef} className={styles.panel} id={panelId} hidden={!archOpen} tabIndex={-1} data-lenis-prevent>
          <h4>{t.architecture}</h4>
          <p>{c.architecture}</p>
          <h4>{t.decisions}</h4>
          <ul>
            {c.decisions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        {project.live && liveMounted && (
          <Suspense fallback={null}>
            <LiveTerminal id={liveId} program={project.id} copy={c.live} hidden={!liveOpen} onClose={closeLive} />
          </Suspense>
        )}
      </div>
    </article>
  )
}
