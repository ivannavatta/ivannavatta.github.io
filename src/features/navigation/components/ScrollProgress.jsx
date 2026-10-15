import { motion, useScroll, useSpring } from 'motion/react'
import styles from '../Navbar.module.css'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 25, restDelta: 0.001 })

  return <motion.div aria-hidden="true" className={styles.progress} style={{ scaleX }} />
}
