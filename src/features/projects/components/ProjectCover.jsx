import styles from '../Projects.module.css'

const HUES = [228, 18, 158, 268, 42]

/** Imagen del proyecto, o una portada generativa en tonos claros si todavía no hay captura. */
export function ProjectCover({ project, title, index = 0 }) {
  if (project.image) {
    return <img src={project.image} alt={title} className={styles.coverImg} loading="lazy" />
  }

  return (
    <div className={styles.coverArt} style={{ '--hue': HUES[index % HUES.length] }} aria-hidden="true">
      <span className={styles.coverGrid} />
      <span className={styles.coverLetter}>{title.charAt(0)}</span>
      <span className={styles.coverTag}>{project.tech.join(' · ')}</span>
    </div>
  )
}
