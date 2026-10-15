import monoFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff?url'
import { RoundedBox, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { EDITOR_FILENAME, editorCode, SYNTAX } from '../../data/editorCode'

const FONT_SIZE = 0.13
const CHAR_WIDTH = FONT_SIZE * 0.6 // JetBrains Mono es monoespaciada: 0.6em por carácter
const LINE_HEIGHT = 0.25
const PADDING = 0.3
const GUTTER = 0.38
const TITLE_HEIGHT = 0.38
const Z = 0.045

const lineLengths = editorCode.map((line) => line.reduce((sum, token) => sum + token.text.length, 0))
const TOTAL_CHARS = lineLengths.reduce((sum, length) => sum + length, 0)
const WIDTH = PADDING * 2 + GUTTER + Math.max(...lineLengths) * CHAR_WIDTH
const HEIGHT = TITLE_HEIGHT + PADDING * 2 + editorCode.length * LINE_HEIGHT
const LEFT = -WIDTH / 2
const TOP = HEIGHT / 2
const CODE_LEFT = LEFT + PADDING + GUTTER
const lineY = (index) => TOP - TITLE_HEIGHT - PADDING - LINE_HEIGHT / 2 - index * LINE_HEIGHT

// Layout estático de cada token: línea, columna y posición global (para el tipeo)
const TOKENS = (() => {
  let start = 0
  return editorCode.flatMap((line, lineIndex) => {
    let column = 0
    return line.map((token) => {
      const layout = { ...token, line: lineIndex, column, start }
      column += token.text.length
      start += token.text.length
      return layout
    })
  })
})()

const WINDOW_DOTS = ['#ff5f57', '#febc2e', '#28c840']

/**
 * Cantidad de caracteres "tipeados". Solo avanza mientras `running` es true
 * (escena visible y loader terminado). Sin animaciones muestra todo el código.
 */
function useTyping(animated, running, speed = 45, startDelay = 700) {
  const [typed, setTyped] = useState(0)

  useEffect(() => {
    if (!animated || !running) return undefined
    let interval
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setTyped((current) => {
          if (current >= TOTAL_CHARS) {
            clearInterval(interval)
            return current
          }
          return current + 1
        })
      }, speed)
    }, startDelay)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [animated, running, speed, startDelay])

  return animated ? typed : TOTAL_CHARS
}

/** Posición (línea, columna) del cursor según los caracteres tipeados. */
function caretPosition(typed) {
  let remaining = typed
  for (let line = 0; line < lineLengths.length; line++) {
    if (remaining <= lineLengths[line]) return { line, column: remaining }
    remaining -= lineLengths[line]
  }
  const last = lineLengths.length - 1
  return { line: last, column: lineLengths[last] }
}

function Caret({ line, column }) {
  const material = useRef(null)

  useFrame(({ clock }) => {
    if (material.current) material.current.opacity = Math.sin(clock.elapsedTime * 6) > 0 ? 0.95 : 0
  })

  return (
    <mesh position={[CODE_LEFT + column * CHAR_WIDTH + CHAR_WIDTH * 0.45, lineY(line), Z]}>
      <planeGeometry args={[CHAR_WIDTH * 0.9, FONT_SIZE * 1.35]} />
      <meshBasicMaterial ref={material} color={SYNTAX.variable} transparent toneMapped={false} />
    </mesh>
  )
}

/** Ventana de editor de código 3D que escribe un objeto `developer`. */
export function CodeEditor({ animated = true, running = true }) {
  const typed = useTyping(animated, running)
  const caret = caretPosition(typed)

  return (
    <group>
      {/* Halo de luz detrás de la ventana */}
      <mesh position={[0, 0, -0.08]}>
        <planeGeometry args={[WIDTH + 0.5, HEIGHT + 0.5]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.12} toneMapped={false} />
      </mesh>

      {/* Cuerpo de la ventana */}
      <RoundedBox args={[WIDTH, HEIGHT, 0.08]} radius={0.07} smoothness={4}>
        <meshStandardMaterial color="#0c0a18" roughness={0.35} metalness={0.4} transparent opacity={0.94} />
      </RoundedBox>

      {/* Barra de título */}
      {WINDOW_DOTS.map((color, index) => (
        <mesh key={color} position={[LEFT + 0.26 + index * 0.17, TOP - TITLE_HEIGHT / 2, Z]}>
          <circleGeometry args={[0.048, 24]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
      <Text
        font={monoFont}
        fontSize={0.11}
        color="#a19dbb"
        anchorX="center"
        anchorY="middle"
        position={[0, TOP - TITLE_HEIGHT / 2, Z]}
      >
        {EDITOR_FILENAME}
      </Text>
      <mesh position={[0, TOP - TITLE_HEIGHT, Z]}>
        <planeGeometry args={[WIDTH - 0.02, 0.006]} />
        <meshBasicMaterial color="#2a2540" />
      </mesh>

      {/* Resaltado de la línea activa */}
      <mesh position={[0, lineY(caret.line), Z - 0.002]}>
        <planeGeometry args={[WIDTH - 0.04, LINE_HEIGHT]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.08} toneMapped={false} />
      </mesh>

      {/* Números de línea */}
      {editorCode.map((_, lineIndex) => (
        <Text
          key={lineIndex}
          font={monoFont}
          fontSize={FONT_SIZE}
          color={lineIndex === caret.line ? '#a19dbb' : '#4b4766'}
          anchorX="left"
          anchorY="middle"
          position={[LEFT + PADDING, lineY(lineIndex), Z]}
        >
          {String(lineIndex + 1)}
        </Text>
      ))}

      {/* Código */}
      {TOKENS.map((token, index) => {
        const visible = token.text.slice(0, Math.max(0, typed - token.start))
        const indent = visible.length - visible.trimStart().length
        if (!visible.trim()) return null
        return (
          <Text
            key={index}
            font={monoFont}
            fontSize={FONT_SIZE}
            color={token.color}
            anchorX="left"
            anchorY="middle"
            position={[CODE_LEFT + (token.column + indent) * CHAR_WIDTH, lineY(token.line), Z]}
          >
            {visible.trimStart()}
          </Text>
        )
      })}

      <Caret line={caret.line} column={caret.column} />
    </group>
  )
}
