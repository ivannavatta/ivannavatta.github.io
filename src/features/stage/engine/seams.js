// Costuras entre capítulos: la transición de tema es ESPACIAL, no cromática.
// Cada sección pinta su fondo; en el borde entre un capítulo claro y uno oscuro, el capítulo
// que entra se arma "pieza por pieza": una fila de bloques del módulo de las trazas (48 px)
// sube desde su borde hacia el relleno inferior del capítulo anterior, con un barrido
// escalonado, hasta dejar un borde recto un módulo más arriba. El texto nunca queda sobre un
// color intermedio: cada píxel es claro u oscuro.
//
// Movimiento (emil-design-eng): solo transform (translateY, en el compositor); atado al scroll
// (scrub, interrumpible y reversible); cada bloque usa la cúbica de entrada y salida porque se
// mueve en pantalla; el rango es media pantalla de scroll (el borde va del pie de la pantalla
// al 50 %), así termina cuando el capítulo "empieza" para la nav. Sin movimiento reducido:
// no se crean (el borde queda recto).
import { THEMES, selectors } from '@/shared/stage'
import { mulberry32 } from '@/shared/utils/traceNet'
import { clamp01, easeInOut } from './math'
import { SEAM_MODULE as MODULE, effectiveTheme } from './chapters'

const RANGE = 0.5 // fracción de pantalla que recorre el borde mientras se arma la costura
const SPREAD = 0.55 // cuánto se escalonan los bloques dentro del rango
const BLOCK_SPAN = 1 - SPREAD // parte del rango que tarda cada bloque en subir
const SEED = 48

export function createSeamLayer(container, { classes }) {
  let seams = []

  function build() {
    container.replaceChildren()
    seams = []
    const sections = Array.from(document.querySelectorAll(selectors.chapters))
    const width = document.documentElement.clientWidth
    const cols = Math.ceil(width / MODULE)
    let n = 0
    for (let i = 1; i < sections.length; i++) {
      const from = effectiveTheme(sections[i - 1])
      const to = effectiveTheme(sections[i])
      if (from === to) continue
      const y = sections[i].getBoundingClientRect().top + window.scrollY
      const strip = document.createElement('div')
      strip.className = classes.seam
      strip.style.top = `${y - MODULE}px`
      // +1 px hacia adentro del capítulo que entra (mismo color): sin hilo claro en el borde
      strip.style.height = `${MODULE + 1}px`
      const rnd = mulberry32(SEED + n)
      const leftToRight = n % 2 === 0 // el barrido alterna de lado en cada costura
      const blocks = []
      for (let c = 0; c < cols; c++) {
        const block = document.createElement('i')
        block.className = to === THEMES.dark ? classes.blockDark : classes.blockLight
        block.style.left = `${c * MODULE}px`
        block.style.width = `${MODULE + 1}px` // +1: sin hilos entre bloques vecinos
        const along = cols > 1 ? c / (cols - 1) : 0
        const offset = SPREAD * (0.5 * (leftToRight ? along : 1 - along) + 0.5 * rnd())
        blocks.push({ el: block, offset, last: '' })
        strip.append(block)
      }
      container.append(strip)
      seams.push({ y, blocks, strip, section: sections[i] })
      n++
    }
    update(window.scrollY)
  }

  function update(scrollY) {
    const vh = window.innerHeight
    for (const seam of seams) {
      const top = seam.y - scrollY // borde en la pantalla
      const p = clamp01((vh - top) / (vh * RANGE))
      for (const b of seam.blocks) {
        const local = clamp01((p - b.offset) / BLOCK_SPAN)
        const v = ((1 - easeInOut(local)) * 100).toFixed(1)
        if (v === b.last) continue
        b.last = v
        b.el.style.transform = `translate3d(0, ${v}%, 0)`
      }
    }
  }

  /** Borde visible (px desde el tope de la pantalla) de la sección, si tiene costura: el tope real de la costura. */
  function edgeOf(section) {
    const seam = seams.find((s) => s.section === section)
    return seam ? seam.strip.getBoundingClientRect().top : null
  }

  function dispose() {
    container.replaceChildren()
    seams = []
  }

  return { build, update, edgeOf, dispose }
}
