import styles from './Figures.module.css'

/** MyTube: capas del frontend y del backend, unidas por HTTP + JWT. */
export function LayersFigure({ copy }) {
  return (
    <figure className={`${styles.fig} ${styles.layers}`}>
      <div>
        <p className={styles.layersHead}>{copy.frontend}</p>
        <ol className={styles.stack}>
          {copy.frontendLayers.map((layer) => (
            <li key={layer}>{layer}</li>
          ))}
        </ol>
      </div>
      <p className={styles.layersLink}>{copy.link}</p>
      <div>
        <p className={styles.layersHead}>{copy.backend}</p>
        <ol className={styles.stack}>
          {copy.backendLayers.map((layer) => (
            <li key={layer}>{layer}</li>
          ))}
        </ol>
        <ul className={styles.stores}>
          {copy.stores.map((store) => (
            <li key={store}>{store}</li>
          ))}
        </ul>
      </div>
      <figcaption>{copy.caption}</figcaption>
    </figure>
  )
}
