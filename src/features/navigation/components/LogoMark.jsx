// El IN en la grilla de 32 (bloques de 4): el mismo dibujo que el favicon.
const BLOCKS = [
  [4, 6], [4, 10], [4, 14], [4, 18], [4, 22],
  [12, 6], [12, 10], [12, 14], [12, 18], [12, 22],
  [16, 10], [16, 14],
  [20, 14],
  [24, 6], [24, 10], [24, 14], [24, 18], [24, 22],
]
const ACCENT = [20, 18]

export function LogoMark({ accentClass }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        {BLOCKS.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" />
        ))}
        <rect className={accentClass} x={ACCENT[0]} y={ACCENT[1]} width="4" height="4" />
      </g>
    </svg>
  )
}
