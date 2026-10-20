import { Fragment, useRef } from 'react'
import { Monogram } from '@/shared/components/Monogram/Monogram'
import { profile } from '@/shared/data/profile'
import { POSES, chapterProps } from '@/shared/stage'
import { useWordReveal } from '../hooks/useWordReveal'
import { copy } from '../i18n'
import styles from './About.module.css'

/**
 * Perfil: título, una declaración que se enciende con la lectura, los datos en una lista de
 * definiciones, el párrafo del CV y tres principios en escalera. A la derecha, el IN queda
 * fijo (sticky) mientras se lee: la escena 3D lo dibuja sobre la grilla de Monogram.
 */
export function About() {
  const statementRef = useRef(null)
  const t = copy.about
  const words = t.statement(profile.startYear).split(/\s+/)
  useWordReveal(statementRef, styles.on)

  return (
    <section {...chapterProps('perfil', 'light')} className={styles.perfil} aria-labelledby="perfil-title">
      <div className={styles.grid}>
        <div className={styles.main}>
          <h2 className={styles.title} id="perfil-title">
            {t.title}
          </h2>
          {/* Cada palabra en su span; el espacio queda afuera para que no se colapse */}
          <p className={styles.statement} ref={statementRef}>
            {words.map((word, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className={styles.word}>{word}</span>
              </Fragment>
            ))}
          </p>
          <div className={styles.about}>
            <dl className={styles.facts}>
              <div>
                <dt>{t.facts.base}</dt>
                <dd>{profile.location.es}</dd>
              </div>
              <div>
                <dt>{t.facts.education}</dt>
                <dd>{t.facts.educationValue(profile.university)}</dd>
              </div>
              <div>
                <dt>{t.facts.since}</dt>
                <dd>{profile.startYear}</dd>
              </div>
            </dl>
            <p className={styles.text}>{t.text}</p>
          </div>
          <ul className={styles.principles}>
            {t.principles.map((p) => (
              <li key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.aside}>
          <Monogram pose={POSES.perfil} className={styles.mono} />
        </div>
      </div>
    </section>
  )
}
