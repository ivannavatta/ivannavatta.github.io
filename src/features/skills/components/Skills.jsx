import { useCallback, useState } from 'react'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { POSES, announceStageHover, blockProps, chapterProps, poseProps } from '@/shared/stage'
import { copy } from '../i18n'
import styles from './Skills.module.css'

const FINE_POINTER = '(hover: hover) and (pointer: fine)'

// Lista plana para indexar los bloques en orden de documento (el orden que lee la escena)
const TILES = copy.layers.flatMap((layer) => layer.tiles)
const START = copy.layers.map((_, i) => copy.layers.slice(0, i).reduce((n, l) => n + l.tiles.length, 0))

/**
 * Stack: cada tecnología es un botón; la escena 3D arma detrás de cada uno un bloque del IN
 * (pose "stack") y lo eleva al pasar el cursor o enfocarlo. El panel "Dónde la usé" es visual
 * (aria-hidden): la misma información llega a los lectores de pantalla dentro del nombre de
 * cada botón, así no hay anuncios en vivo a cada movimiento del cursor.
 */
export function Skills() {
  const t = copy.skills
  const fine = useMediaQuery(FINE_POINTER)
  const [active, setActive] = useState(-1) // bloque resaltado (cursor o foco)
  const [shown, setShown] = useState(-1) // lo que muestra el panel: queda el último elegido

  const show = useCallback((i) => {
    setActive(i)
    setShown(i)
    announceStageHover(POSES.stack, i)
  }, [])

  // El cursor sale de las capas: baja el bloque; el panel conserva la última tecnología
  const leave = useCallback(() => {
    setActive(-1)
    announceStageHover(POSES.stack, -1)
  }, [])

  // El foco de teclado sale de las capas: también baja el bloque
  const onBlur = useCallback(
    (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) leave()
    },
    [leave],
  )

  const current = TILES[shown]

  return (
    <section {...chapterProps('stack', 'dark')} className={styles.stack} aria-labelledby="stack-title">
      <div className={styles.grid}>
        <div className={styles.intro}>
          <h2 className={styles.title} id="stack-title">
            {t.title}
          </h2>
          <p className={styles.lead}>{fine ? t.lead : t.leadTouch}</p>
          <div className={styles.detail} aria-hidden="true">
            <p className={styles.detailName}>{current ? current.name : t.detailTitle}</p>
            <p className={styles.detailUse}>{current ? current.use : t.detailHint}</p>
          </div>
        </div>
        <div className={styles.layers} {...poseProps(POSES.stack)} onPointerLeave={fine ? leave : undefined}
          onBlur={onBlur}
        >
          {copy.layers.map((layer, l) => (
            <div className={styles.layer} key={layer.name}>
              <h3 className={styles.layerName}>{layer.name}</h3>
              <ul className={styles.tiles}>
                {layer.tiles.map((tile, k) => {
                  const i = START[l] + k
                  return (
                    <li key={tile.name}>
                      <button
                        type="button"
                        className={i === active ? `${styles.tile} ${styles.active}` : styles.tile}
                        {...blockProps()}
                        onFocus={() => show(i)}
                        onClick={() => show(i)}
                        onPointerEnter={fine ? () => show(i) : undefined}
                      >
                        {tile.name}
                        <span className="sr-only">: {tile.sr}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
