import { motion } from 'motion/react'
import { EASE_OUT } from '../../animations/variants'
import styles from './RevealText.module.css'

const word = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 1, ease: EASE_OUT } },
}

/**
 * Revela el texto palabra por palabra desde una línea oculta (máscara).
 * - `text`: string, o array de segmentos { text, className } para mezclar estilos.
 * - `animate`: si se pasa, controla la animación (ej. hero); si no, se activa al entrar en pantalla.
 */
export function RevealText({ as = 'span', text, className = '', delay = 0, stagger = 0.06, animate }) {
  const Component = motion[as] ?? motion.span
  const segments = typeof text === 'string' ? [{ text }] : text
  // Cada palabra recuerda si después hay un espacio real (así "juntos*?" no se separa en "juntos ?")
  const words = segments.flatMap(({ text: segment, className: segmentClass }, segmentIndex) => {
    const parts = segment.split(' ')
    const nextStartsWithSpace = segments[segmentIndex + 1]?.text.startsWith(' ') ?? false
    return parts
      .map((value, partIndex) => ({
        value,
        className: segmentClass,
        spaceAfter: partIndex < parts.length - 1 || nextStartsWithSpace,
      }))
      .filter((item) => item.value)
  })
  const fullText = words
    .map((item) => item.value + (item.spaceAfter ? ' ' : ''))
    .join('')
    .trim()

  const trigger =
    animate === undefined
      ? { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.5 } }
      : { initial: 'hidden', animate: animate ? 'visible' : 'hidden' }

  return (
    <Component
      className={className}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      aria-label={fullText}
      {...trigger}
    >
      {words.map((item, index) => (
        <span key={index} className={styles.mask} aria-hidden="true">
          <motion.span className={`${styles.word} ${item.className ?? ''}`} variants={word}>
            {item.value}
          </motion.span>
          {index < words.length - 1 && item.spaceAfter && ' '}
        </span>
      ))}
    </Component>
  )
}
