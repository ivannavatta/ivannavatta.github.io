import { motion } from 'motion/react'
import { ALL } from '../hooks/useProjectFilter'
import styles from '../Projects.module.css'

export function TechFilter({ filters, active, onChange, allLabel, label }) {
  return (
    <div className={styles.filters} role="group" aria-label={label}>
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          className={`${styles.filter} ${active === filter ? styles.filterActive : ''}`}
          onClick={() => onChange(filter)}
          aria-pressed={active === filter}
        >
          {active === filter && (
            <motion.span
              layoutId="filter-pill"
              className={styles.filterPill}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className={styles.filterLabel}>{filter === ALL ? allLabel : filter}</span>
        </button>
      ))}
    </div>
  )
}
