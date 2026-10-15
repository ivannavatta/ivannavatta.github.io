import { useEffect, useState } from 'react'

/**
 * Escribe y borra cada palabra de la lista en loop.
 * Con `paused` muestra la primera palabra completa (ej: reduced motion).
 */
export function useTypewriter(words, { typeSpeed = 70, deleteSpeed = 40, pause = 1800, paused = false } = {}) {
  const [state, setState] = useState({ wordIndex: 0, text: '', deleting: false })
  const [prevWords, setPrevWords] = useState(words)

  // Reiniciar si cambian las palabras (cambio de idioma)
  if (words !== prevWords) {
    setPrevWords(words)
    setState({ wordIndex: 0, text: '', deleting: false })
  }

  useEffect(() => {
    if (paused || words.length === 0) return undefined

    const current = words[state.wordIndex % words.length]
    let delay = state.deleting ? deleteSpeed : typeSpeed

    if (!state.deleting && state.text === current) delay = pause
    if (state.deleting && state.text === '') delay = 300

    const timeout = setTimeout(() => {
      setState(({ wordIndex, text, deleting }) => {
        const word = words[wordIndex % words.length]
        if (!deleting && text === word) return { wordIndex, text, deleting: true }
        if (deleting && text === '') return { wordIndex: wordIndex + 1, text: '', deleting: false }
        const next = deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)
        return { wordIndex, text: next, deleting }
      })
    }, delay)

    return () => clearTimeout(timeout)
  }, [state, words, typeSpeed, deleteSpeed, pause, paused])

  return paused ? words[0] : state.text
}
