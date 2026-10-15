import styles from '../Projects.module.css'

const HUES = [270, 190, 320, 220, 160]

/** Imagen del proyecto, o una portada generativa si todavía no hay captura. */
export function ProjectCover({ project, title, index = 0 }) {
  if (project.image) {
    return <img src={project.image} alt={title} className={styles.coverImg} loading="lazy" />
  }

  const hue = HUES[index % HUES.length]

  return (
    <div className={styles.coverArt} style={{ '--hue': hue }} aria-hidden="true">
      <span className={styles.coverGrid} />
      <span className={styles.coverOrb} />
      <span className={styles.coverLetter}>{title.charAt(0)}</span>
      <span className={styles.coverCode}>
        {'<'}
        {project.tech[0] ?? 'code'}
        {' />'}
      </span>
    </div>
  )
}
