import { usePrefersReducedMotion } from '@/shared/hooks'
import { EDITOR_FILENAME, editorCode } from '../data/editorCode'
import { useTypedCount } from '../hooks/useTypedCount'
import styles from '../Hero.module.css'

// Layout estático: posición global de cada línea y token (para saber qué mostrar al tipear)
const LINES = (() => {
  let offset = 0
  return editorCode.map((line) => {
    const start = offset
    const tokens = line.map((token) => {
      const layout = { ...token, start: offset }
      offset += token.text.length
      return layout
    })
    return { start, end: offset, tokens }
  })
})()
const TOTAL_CHARS = LINES[LINES.length - 1].end

/** Bloque de código 2D que "tipea" el objeto `developer` con resaltado de sintaxis. */
export function CodeBlock({ label }) {
  const reducedMotion = usePrefersReducedMotion()
  const typed = useTypedCount(TOTAL_CHARS, { enabled: !reducedMotion })
  const caretLine = Math.max(
    0,
    LINES.findIndex((line) => typed <= line.end),
  )

  return (
    <figure className={styles.code} aria-label={label}>
      <figcaption className={styles.codeHeader}>
        <span className={styles.codeDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className={styles.codeFile}>{EDITOR_FILENAME}</span>
        <span className={styles.codeLang}>JS</span>
      </figcaption>
      <pre className={styles.codeBody} aria-hidden="true">
        {LINES.map((line, lineIndex) => (
          <span
            key={lineIndex}
            className={`${styles.codeLine} ${lineIndex === caretLine ? styles.codeLineActive : ''}`}
          >
            <span className={styles.lineNumber}>{lineIndex + 1}</span>
            <span>
              {line.tokens.map((token, tokenIndex) => {
                const text = token.text.slice(0, Math.max(0, typed - token.start))
                return text ? (
                  <span key={tokenIndex} style={{ color: token.color }}>
                    {text}
                  </span>
                ) : null
              })}
              {lineIndex === caretLine && <span className={styles.caret} />}
            </span>
          </span>
        ))}
      </pre>
    </figure>
  )
}
