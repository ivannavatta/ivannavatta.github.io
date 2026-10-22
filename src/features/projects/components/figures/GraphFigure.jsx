import styles from './Figures.module.css'

// Terminales del grafo: [x, y, etiqueta, x e y de la etiqueta, estado]
const NODES = [
  [34, 50, 'A', 44, 38],
  [140, 30, 'B', 150, 20],
  [252, 74, 'C', 262, 64],
  [348, 42, 'D', 358, 32],
  [112, 172, 'E', 98, 214],
  [230, 190, 'F', 240, 232],
  [340, 180, 'G', 372, 222, 'end'],
]
const OFFLINE = [44, 210]
const EDGES = ['M44 60 L150 40', 'M150 40 L262 84', 'M262 84 L358 52', 'M150 40 L122 182', 'M262 84 L240 200', 'M358 52 L350 190']
const ROUTE = 'M44 60 L122 182 L240 200 L350 190'

/** Sistema de transporte: grafo con la ruta A → G resaltada y una terminal sin conexión. */
export function GraphFigure({ copy, id }) {
  const titleId = `${id}-graph-title`
  return (
    <figure className={`${styles.fig} ${styles.graph}`}>
      <svg viewBox="0 0 400 250" role="img" aria-labelledby={titleId}>
        <title id={titleId}>{copy.title}</title>
        <g className={styles.edges}>
          {EDGES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <path className={styles.route} d={ROUTE} />
        <g className={styles.nodes}>
          {NODES.map(([x, y, label, , , state]) => (
            <rect key={label} className={state === 'end' ? styles.nodeEnd : undefined} x={x} y={y} width="20" height="20" />
          ))}
          <rect className={styles.nodeOff} x={OFFLINE[0]} y={OFFLINE[1]} width="20" height="20" />
        </g>
        <g className={styles.labels} aria-hidden="true">
          {NODES.map(([, , label, lx, ly]) => (
            <text key={label} x={lx} y={ly}>
              {label}
            </text>
          ))}
          <text className={styles.labelStart} x="74" y="226">
            {copy.offline}
          </text>
        </g>
      </svg>
      <figcaption>{copy.caption}</figcaption>
    </figure>
  )
}
