import styles from '../Skills.module.css'

/** Cinta infinita con todas las tecnologías. */
export function SkillMarquee({ skills, reverse = false }) {
  // Duplicamos la lista para que el loop sea continuo
  const items = [...skills, ...skills, ...skills, ...skills]

  return (
    <div className={styles.marquee} aria-hidden="true">
      <div className={`${styles.marqueeTrack} ${reverse ? styles.reverse : ''}`}>
        {items.map(({ name, icon: Icon, color }, index) => (
          <span key={`${name}-${index}`} className={styles.marqueeItem} style={{ '--brand': color }}>
            <Icon />
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}
