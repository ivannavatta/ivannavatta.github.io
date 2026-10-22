import styles from './Figures.module.css'

/** box9: matriz 3 × 3 de desempeño y potencial, con la celda del ejemplo marcada. */
export function MatrixFigure({ copy }) {
  // Fila de arriba = potencial alto; columna de la derecha = desempeño alto
  const cells = Array.from({ length: 9 }, (_, i) => i)
  return (
    <figure className={`${styles.fig} ${styles.matrix}`}>
      <div className={styles.matrixWrap}>
        <p className={styles.axisY}>{copy.y}</p>
        <div className={styles.matrixGrid} role="img" aria-label={copy.label}>
          {cells.map((i) => (
            <span key={i} className={i === 2 ? styles.mark : undefined}>
              {i === 2 ? copy.mark : null}
            </span>
          ))}
        </div>
        <p className={styles.axisX}>{copy.x}</p>
      </div>
      <figcaption>{copy.caption}</figcaption>
    </figure>
  )
}
