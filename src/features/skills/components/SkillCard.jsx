import { motion } from 'motion/react'
import { fadeUp, scaleIn, stagger } from '@/shared/animations/variants'
import { TiltCard } from '@/shared/components'
import styles from '../Skills.module.css'

export function SkillCard({ index, title, description, skills }) {
  return (
    <motion.div variants={fadeUp} className={styles.cardWrapper}>
      <TiltCard className={styles.card} maxTilt={6}>
        <span className={styles.cardIndex}>0{index + 1}</span>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>

        <motion.ul className={styles.skillList} variants={stagger(0.07, 0.2)}>
          {skills.map(({ name, icon: Icon, color }) => (
            <motion.li
              key={name}
              className={styles.skill}
              style={{ '--brand': color }}
              variants={scaleIn}
              whileHover={{ y: -6, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Icon className={styles.skillIcon} aria-hidden="true" />
              <span>{name}</span>
            </motion.li>
          ))}
        </motion.ul>
      </TiltCard>
    </motion.div>
  )
}
