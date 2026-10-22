import { useRef } from 'react'
import { Button } from '@/shared/components/Button/Button'
import { CircuitTraces } from '@/shared/components/CircuitTraces/CircuitTraces'
import { Monogram } from '@/shared/components/Monogram/Monogram'
import { profile } from '@/shared/data/profile'
import { POSES, chapterProps } from '@/shared/stage'
import { useFitLine } from '../hooks/useFitLine'
import { useHeroPin } from '../hooks/useHeroPin'
import { copy } from '../i18n'
import styles from './Hero.module.css'

const NAME_MAX_PX = 420

/**
 * Inicio: nombre a todo el ancho, propuesta de valor, dos acciones y el IN de bloques
 * (la escena 3D lo dibuja encima de la grilla de Monogram y lo inclina con el cursor).
 * Al bajar, el inicio se encoge a un marco, detrás pasa el fondo oscuro con dos filas
 * cruzadas y el IN explota y se rearma como firma en el centro (pose "firma").
 */
export function Hero() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const frameRef = useRef(null)
  const rowARef = useRef(null)
  const rowBRef = useRef(null)
  const nameRef = useRef(null)
  const t = copy.hero

  useFitLine(nameRef, NAME_MAX_PX)
  useHeroPin({ sectionRef, pinRef, frameRef, rowARef, rowBRef })

  return (
    <section
      ref={sectionRef}
      {...chapterProps('inicio', 'light', { backdrop: 'dark' })}
      className={styles.hero}
      aria-labelledby="hero-title"
    >
      <div className={styles.pin} ref={pinRef}>
        <div className={styles.rows} aria-hidden="true">
          <p className={styles.row}>
            <span ref={rowARef}>{t.rowA}</span>
          </p>
          <p className={`${styles.row} ${styles.rowAccent}`}>
            <span ref={rowBRef}>{t.rowB}</span>
          </p>
        </div>

        {/* El marco es una región clara propia (data-theme): la cabecera la detecta al encogerse */}
        <div className={styles.frame} ref={frameRef} data-theme="light">
          <CircuitTraces seed={3} className={styles.traces} />
          <div className={styles.inner}>
            <div className={styles.copy}>
              <p className={styles.lead}>{t.lead}</p>
              <p className={styles.meta}>{t.meta}</p>
              <div className={styles.actions}>
                <Button href="#proyectos">{t.ctaProjects}</Button>
                <Button href={profile.cvUrl} variant="quiet" note={t.cvNote} download>
                  {t.ctaCv}
                </Button>
              </div>
            </div>
            <Monogram pose={POSES.hero} className={styles.mono} />
            <h1 className={styles.name} id="hero-title" ref={nameRef}>
              <span>{t.firstName}</span> <span>{t.lastName}</span>
            </h1>
          </div>
        </div>

        <Monogram pose={POSES.firma} className={styles.firma} />
      </div>
    </section>
  )
}
