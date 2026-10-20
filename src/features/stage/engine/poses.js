// Poses del IN: qué rectángulos del DOM ocupa en cada capítulo y con qué material.
// Los rectángulos salen del contrato data-stage-* (src/shared/stage): stage no conoce
// las clases ni los componentes de las secciones.
import { POSES, selectors } from '@/shared/stage'
import { cssColor } from './tokens'

const BRICK_GAP = 6
const BRICK_ROWS = [10, 9] // hilera de abajo, hilera de arriba (trabada medio ladrillo)

function poseRoot(pose) {
  return document.querySelector(selectors.pose(pose))
}

/** Se vuelve a consultar el DOM en cada lectura: sobrevive a re-renders de las secciones. */
function blocksOf(pose) {
  const root = poseRoot(pose)
  return root ? Array.from(root.querySelectorAll(selectors.block)) : []
}

function toRect(el, offsetY) {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top + offsetY, w: r.width, h: r.height }
}

/** absolute: coordenadas de documento (canvas absoluto, movimiento reducido). */
function blockSlots(pose, { absolute = false } = {}) {
  return () => {
    const offsetY = absolute ? window.scrollY : 0
    return blocksOf(pose).map((el) => toRect(el, offsetY))
  }
}

function accentSlots(pose) {
  return () => blocksOf(pose).reduce((acc, el, i) => (el.matches(selectors.accent) ? [...acc, i] : acc), [])
}

/** Dos hileras de ladrillos trabados dentro del rectángulo de la pose (soporte de los proyectos). */
function brickSlots(pose) {
  return () => {
    const root = poseRoot(pose)
    if (!root) return []
    const r = root.getBoundingClientRect()
    const [n1, n2] = BRICK_ROWS
    const rowH = (r.height - BRICK_GAP) / 2
    const w1 = (r.width - BRICK_GAP * (n1 - 1)) / n1
    const out = []
    for (let i = 0; i < n1; i++) out.push({ x: r.left + i * (w1 + BRICK_GAP), y: r.top + rowH + BRICK_GAP, w: w1, h: rowH })
    for (let i = 0; i < n2; i++) out.push({ x: r.left + (w1 + BRICK_GAP) / 2 + i * (w1 + BRICK_GAP), y: r.top, w: w1, h: rowH })
    return out
  }
}

export function buildPoses() {
  const c = {
    ink: cssColor('--light-ink'),
    accent: cssColor('--light-accent'),
    accentDark: cssColor('--dark-accent'),
    blockLight: cssColor('--block-light'),
    blockBase: cssColor('--block-base'),
    tile: cssColor('--tile'),
    tileActive: cssColor('--tile-active'),
  }
  const mono = (pose) => ({ slots: blockSlots(pose), accentSlots: accentSlots(pose), mode: 'split' })

  return {
    [POSES.hero]: { ...mono(POSES.hero), relief: 0.9, color: c.ink, accent: c.accent, interactive: 1 },
    [POSES.firma]: { ...mono(POSES.firma), relief: 0, color: c.blockLight, accent: c.accentDark, interactive: 0.25 },
    [POSES.perfil]: { ...mono(POSES.perfil), relief: 0.5, color: c.ink, accent: c.accent, interactive: 0.45 },
    [POSES.visor]: {
      slots: brickSlots(POSES.visor),
      accentSlots: () => [13],
      mode: 'solid',
      depth: () => 44,
      color: c.blockBase,
      accent: c.accentDark,
    },
    [POSES.stack]: {
      slots: blockSlots(POSES.stack),
      mode: 'solid',
      depth: (r) => Math.min(r.h, 64),
      color: c.tile,
      hoverColor: c.tileActive,
      hover: -1,
    },
    [POSES.path]: {
      slots: blockSlots(POSES.path),
      accentSlots: accentSlots(POSES.path),
      mode: 'solid',
      depth: (r) => r.w,
      color: c.ink,
      accent: c.accent,
    },
    [POSES.contact]: { ...mono(POSES.contact), relief: 0.9, color: c.blockLight, accent: c.accentDark, interactive: 1 },
  }
}

/** Movimiento reducido: solo el IN del inicio, quieto, en coordenadas de documento. */
export function buildReducedPoses() {
  return {
    [POSES.hero]: {
      slots: blockSlots(POSES.hero, { absolute: true }),
      accentSlots: accentSlots(POSES.hero),
      mode: 'split',
      relief: 0.8,
      color: cssColor('--light-ink'),
      accent: cssColor('--light-accent'),
      interactive: 0,
    },
  }
}
