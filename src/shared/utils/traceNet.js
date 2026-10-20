/**
 * Red de trazas de circuito sobre una grilla de 48 px: tramos rectos y giros de 45°,
 * con un pad cuadrado en cada extremo. Determinística por semilla (misma red en cada visita).
 * Devuelve datos, no markup: { d, pads: [[x, y], …] }.
 */
const GRID = 48
const DIRS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
]

export function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function traceNet(width, height, seed, density) {
  const rnd = mulberry32(seed)
  const cols = Math.ceil(width / GRID)
  const rows = Math.ceil(height / GRID)
  const count = Math.round((cols * rows) / density)
  let d = ''
  const pads = []
  for (let n = 0; n < count; n++) {
    let x = Math.floor(rnd() * cols) * GRID
    let y = Math.floor(rnd() * rows) * GRID
    let dir = Math.floor(rnd() * 4)
    d += `M${x} ${y}`
    pads.push([x, y])
    const segs = 2 + Math.floor(rnd() * 4)
    for (let s = 0; s < segs; s++) {
      const len = (1 + Math.floor(rnd() * 4)) * GRID
      const [dx, dy] = DIRS[dir]
      const diag = dx !== 0 && dy !== 0
      const step = diag ? len * 0.5 : len
      x += dx * step
      y += dy * step
      d += `L${x} ${y}`
      // giro de 45° (circuito): alterna entre recto y diagonal
      if (diag) dir = rnd() < 0.5 ? (dx > 0 ? 0 : 2) : 1
      else dir = 4 + Math.floor(rnd() * 4)
    }
    pads.push([x, y])
  }
  return { d, pads }
}

