import monoFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff?url'
import { Float, Text } from '@react-three/drei'

const SYMBOLS = [
  { text: '</>', position: [-3.1, 1.9, -2.2], size: 0.5, color: '#a855f7' },
  { text: '{ }', position: [3.2, 2.1, -2.8], size: 0.45, color: '#22d3ee' },
  { text: '=>', position: [-3.4, -1.6, -1.8], size: 0.4, color: '#22d3ee' },
  { text: '( )', position: [3.3, -1.9, -2.4], size: 0.38, color: '#f472b6' },
  { text: '[ ]', position: [0.4, 2.7, -3.2], size: 0.36, color: '#a855f7' },
  { text: ';', position: [-1.6, -2.6, -2.6], size: 0.45, color: '#f472b6' },
  { text: '&&', position: [1.9, -2.7, -3.4], size: 0.32, color: '#a855f7' },
  { text: '//', position: [-0.9, 2.5, -2.4], size: 0.3, color: '#22d3ee' },
  { text: '01', position: [4.1, 0.2, -3.6], size: 0.34, color: '#f472b6' },
  { text: '#', position: [-4.1, 0.3, -3.2], size: 0.4, color: '#22d3ee' },
]

/** Símbolos de sintaxis flotando en el fondo. */
export function SyntaxSymbols({ animated = true }) {
  return SYMBOLS.map(({ text, position, size, color }, index) => (
    <Float
      key={text}
      speed={animated ? 1.2 + (index % 4) * 0.35 : 0}
      rotationIntensity={animated ? 0.6 : 0}
      floatIntensity={animated ? 1.2 : 0}
    >
      <Text
        font={monoFont}
        fontSize={size}
        color={color}
        fillOpacity={0.35}
        anchorX="center"
        anchorY="middle"
        position={position}
      >
        {text}
      </Text>
    </Float>
  ))
}
