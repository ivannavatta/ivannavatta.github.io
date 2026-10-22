import { useState } from 'react'
import { TextLink } from '@/shared/components/TextLink/TextLink'
import { copy } from '../i18n'
import { CaseFigure } from './figures/CaseFigure'
import styles from './Projects.module.css'

/**
 * Un caso: título, año y tipo, problema, rol, stack y repositorios. A la derecha, su figura;
 * "Ver arquitectura" la cambia, en el mismo lugar, por la arquitectura y las decisiones.
 */
export function ProjectCase({ project, caseRef }) {
  const [open, setOpen] = useState(false)
  const t = copy.projects
  const c = copy.cases[project.id]
  const titleId = `t-${project.id}`
  const panelId = `more-${project.id}`

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
          <button
            className={styles.more}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t.less : t.more}
          </button>
        </div>
      </div>
      <div className={styles.side} data-open={open || undefined}>
        <CaseFigure kind={project.figure} copy={c.figure} id={project.id} />
        <div className={styles.panel} id={panelId} hidden={!open} tabIndex={-1}>
          <h4>{t.architecture}</h4>
          <p>{c.architecture}</p>
          <h4>{t.decisions}</h4>
          <ul>
            {c.decisions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
