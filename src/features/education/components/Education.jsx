import { POSES, chapterProps, poseProps } from '@/shared/stage'
import { STEPS } from '../data/steps'
import { copy } from '../i18n'
import { Step } from './Step'
import styles from './Education.module.css'

/**
 * Recorrido: cuatro cursos y la carrera en curso, en una lista ordenada. Cada curso tiene su
 * columna de bloques (uno cada ~10 h); la escena 3D arma ahí la pose "path" del IN.
 */
export function Education() {
  const t = copy.education

  return (
    <section {...chapterProps('recorrido', 'light')} className={styles.path} aria-labelledby="path-title">
      <div className={styles.head}>
        <h2 className={styles.title} id="path-title">
          {t.title}
        </h2>
        <p className={styles.lead}>{t.lead}</p>
      </div>
      <ol className={styles.list} {...poseProps(POSES.path)}>
        {STEPS.map((step) => (
          <Step key={step.id} step={step} />
        ))}
      </ol>
    </section>
  )
}
