import styles from './Figures.module.css'

/** uadeHUB: la consola con los textos reales del programa; el legajo de ejemplo va marcado. */
export function ConsoleFigure({ copy }) {
  return (
    <figure className={`${styles.fig} ${styles.console}`}>
      <pre>
        <code>
          {copy.before}
          <mark>{copy.example}</mark>
          {copy.after}
        </code>
      </pre>
      <figcaption>{copy.caption}</figcaption>
    </figure>
  )
}
