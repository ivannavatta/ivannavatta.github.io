import { motion } from 'motion/react'
import { ALL } from '../hooks/useProjectFilter'
import styles from '../Projects.module.css'

/** Filtros como pestañas de texto con una línea de acento que se desliza al activo. */
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
          {filter === ALL ? allLabel : filter}
          {active === filter && (
            <motion.span
              layoutId="filter-line"
              className={styles.filterLine}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
