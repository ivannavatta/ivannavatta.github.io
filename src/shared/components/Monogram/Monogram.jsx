import { blockProps, poseProps } from '@/shared/stage'
import styles from './Monogram.module.css'

/**
 * El IN de bloques: grilla de 6 × 5 con 19 celdas (I, N) y un bloque de acento.
 * Cada celda es un "bloque" del contrato de stage: la escena 3D se alinea sobre ellas.
 * Sin WebGL o antes de que cargue la escena, se ven estos bloques planos.
 */
const CELLS = [
  [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
  [3, 1], [3, 2], [3, 3], [3, 4], [3, 5],
  [4, 2], [4, 3],
  [5, 3], [5, 4],
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
]
const ACCENT = 13

export function Monogram({ pose, className }) {
  return (
    <div className={className ? `${styles.mono} ${className}` : styles.mono} {...poseProps(pose)} aria-hidden="true">
      {CELLS.map(([c, r], i) => (
        <i
          key={`${c}-${r}`}
          className={i === ACCENT ? styles.accent : undefined}
          style={{ '--c': c, '--r': r }}
          {...blockProps({ accent: i === ACCENT })}
        />
      ))}
    </div>
  )
}
