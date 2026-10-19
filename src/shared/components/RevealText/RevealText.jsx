import { motion } from 'motion/react'
import { Fragment } from 'react'
import { EASE_OUT } from '../../animations/variants'
import styles from './RevealText.module.css'

const word = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 1, ease: EASE_OUT } },
}

/**
 * Agrupa el texto en "unidades" que se revelan juntas.
 * Las palabras sin espacio real entre sí (ej. "juntos" + "?") comparten máscara para que
 * la puntuación nunca quede sola en otra línea. El espacio entre unidades va FUERA de la
 * máscara: dentro de un inline-block el navegador lo descarta y las palabras quedan pegadas.
 */
function toUnits(segments) {
  const units = []
  let current = []

  segments.forEach(({ text: segment, className }, segmentIndex) => {
    const parts = segment.split(' ')
    const nextStartsWithSpace = segments[segmentIndex + 1]?.text.startsWith(' ') ?? false

    parts.forEach((value, partIndex) => {
      const spaceAfter = partIndex < parts.length - 1 || nextStartsWithSpace
      if (value) current.push({ value, className })
      if (spaceAfter && current.length) {
        units.push(current)
        current = []
      }
    })
  })

  if (current.length) units.push(current)
  return units
}

/**
 * Revela el texto palabra por palabra desde una línea oculta (máscara).
 * - `text`: string, o array de segmentos { text, className } para mezclar estilos.
 * - `animate`: si se pasa, controla la animación (ej. hero); si no, se activa al entrar en pantalla.
 * Los lectores de pantalla leen una copia en `.sr-only`; las máscaras animadas van con aria-hidden.
 */
export function RevealText({ as = 'span', text, className = '', delay = 0, stagger = 0.06, animate }) {
  const Component = motion[as] ?? motion.span
  const segments = typeof text === 'string' ? [{ text }] : text
  const units = toUnits(segments)
  const fullText = units.map((unit) => unit.map((part) => part.value).join('')).join(' ')

  const trigger =
    animate === undefined
      ? { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.5 } }
      : { initial: 'hidden', animate: animate ? 'visible' : 'hidden' }

  return (
    <Component
      className={className}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      {...trigger}
    >
      <span className="sr-only">{fullText}</span>
      <span aria-hidden="true">
        {units.map((unit, unitIndex) => (
          <Fragment key={unitIndex}>
            <span className={styles.mask}>
              {unit.map((part, partIndex) => (
                <motion.span key={partIndex} className={`${styles.word} ${part.className ?? ''}`} variants={word}>
                  {part.value}
                </motion.span>
              ))}
            </span>
            {unitIndex < units.length - 1 && ' '}
          </Fragment>
        ))}
      </span>
    </Component>
  )
}
