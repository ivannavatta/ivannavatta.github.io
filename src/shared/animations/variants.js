export const EASE_OUT = [0.22, 1, 0.36, 1]

// Movimientos cortos y sin blur: el minimalismo pide sutileza
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1, ease: EASE_OUT } },
}

export const stagger = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
})

// Props comunes para animar al entrar en pantalla
export const inView = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, amount: 0.25 },
}
