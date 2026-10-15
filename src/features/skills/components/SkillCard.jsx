import { motion } from 'motion/react'
import { fadeUp, stagger } from '@/shared/animations/variants'
import styles from '../Skills.module.css'

/** Columna de una categoría: número, título, descripción y lista de tecnologías. */
export function SkillCard({ index, title, description, skills }) {
  return (
    <motion.div className={styles.column} variants={fadeUp}>
      <span className={styles.index}>0{index + 1}</span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>

      <motion.ul className={styles.list} variants={stagger(0.06, 0.15)}>
        {skills.map(({ name, icon: Icon, color }) => (
          <motion.li key={name} className={styles.skill} style={{ '--brand': color }} variants={fadeUp}>
            <Icon className={styles.icon} aria-hidden="true" />
            <span>{name}</span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  )
}
