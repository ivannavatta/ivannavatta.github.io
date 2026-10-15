import { motion } from 'motion/react'
import { EASE_OUT } from '../../animations/variants'
import styles from './Divider.module.css'

/** Línea de 1px que se dibuja de izquierda a derecha al entrar en pantalla. */
export function Divider({ className = '', delay = 0 }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`${styles.divider} ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 1 }}
      transition={{ duration: 1.2, ease: EASE_OUT, delay }}
    />
  )
}
