import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAPTERS, selectors } from '@/shared/stage'
import { useScrollTick } from './useScrollTick'

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const CHAPTER_LINE = 0.45 // un capítulo empieza cuando su borde superior cruza el 45 % de la pantalla

/**
 * Capítulo actual y avance de la lectura sobre la traza de la nav.
 * Cada pad tiene una cadena de tramos que se llena mientras leés el capítulo anterior;
 * la primera cadena empieza con la traza que sale del chip. En mobile los tramos del panel
 * son verticales y la traza de la barra se llena con el avance de toda la página.
 * Los rellenos se escriben de forma imperativa (transform), sin re-render por cuadro;
 * el capítulo actual sí es estado (cambia pocas veces).
 */
export function useChapterProgress({ headerRef, leadRef, wireRefs, mobile, litClass }) {
  const [chapter, setChapter] = useState(CHAPTERS[0])
  const chains = useRef([])
  const leadPiece = useRef(null)
  const lastFills = useRef(new Map())

  const measure = useCallback((lead, wires) => {
    if (!lead || !wires.length) return
    const piece = (box, isLead) => {
      const vert = mobile && !isLead
      const off = mobile && isLead // en mobile la traza de la barra va con el avance total
      const len = off ? 0 : vert ? box.offsetHeight : box.offsetWidth || box.getBoundingClientRect().width || 0
      return { box, el: box.querySelector('i'), vert, off, len }
    }
    leadPiece.current = piece(lead, true)
    chains.current = wires.map((box) => [piece(box, false)])
    chains.current[0].unshift(leadPiece.current)
    lastFills.current.clear() // cambió el eje o el largo: hay que volver a escribir todos los rellenos
  }, [mobile])

  const write = useCallback((el, value, vert) => {
    if (!el || lastFills.current.get(el) === value) return
    lastFills.current.set(el, value)
    el.style.transform = vert ? `scaleY(${value})` : `scaleX(${value})`
  }, [])

  const fillChain = useCallback(
    (chain, f) => {
      const total = chain.reduce((s, p) => s + p.len, 0) || 1
      let acc = 0
      for (const p of chain) {
        if (p.off) continue
        const local = p.len ? clamp01((f * total - acc) / p.len) : 0
        acc += p.len
        write(p.el, local.toFixed(3), p.vert)
      }
    },
    [write],
  )

  const update = useCallback(
    (y) => {
      const sections = Array.from(document.querySelectorAll(selectors.chapters))
      if (!sections.length || !chains.current.length) return
      const vh = window.innerHeight
      const max = document.documentElement.scrollHeight - vh
      const starts = sections.map((el, i) => (i === 0 ? 0 : el.getBoundingClientRect().top + y - vh * CHAPTER_LINE))
      let c = 0
      for (let i = 1; i < starts.length; i++) if (starts[i] <= y) c = i
      const next = c + 1 < starts.length ? starts[c + 1] : max
      const span = next - starts[c]
      const pos = c + (span > 0 ? clamp01((y - starts[c]) / span) : 1)
      setChapter(sections[c].dataset.chapter)
      chains.current.forEach((chain, i) => fillChain(chain, clamp01(pos - i)))
      if (mobile && leadPiece.current) {
        write(leadPiece.current.el, clamp01(pos / (sections.length - 1)).toFixed(3), false)
        headerRef.current?.classList.toggle(litClass, pos > 0.001)
      }
    },
    [mobile, fillChain, write, headerRef, litClass],
  )
  useScrollTick(update)

  // Medir al montar, al cambiar de mobile a escritorio y cada vez que la cabecera cambia de tamaño
  useEffect(() => {
    const header = headerRef.current
    if (!header) return undefined
    if (!mobile) {
      if (leadRef.current?.querySelector('i')) leadRef.current.querySelector('i').style.transform = ''
      header.classList.remove(litClass)
    }
    let alive = true
    const relayout = () => {
      if (!alive) return
      measure(leadRef.current, wireRefs.current.filter(Boolean))
      update(window.scrollY)
    }
    relayout()
    document.fonts?.ready.then(relayout)
    const observer = new ResizeObserver(relayout)
    observer.observe(header)
    if (leadRef.current) observer.observe(leadRef.current) // su largo cambia con el ancho del bloque centrado
    return () => {
      alive = false
      observer.disconnect()
    }
  }, [headerRef, leadRef, wireRefs, mobile, litClass, measure, update])

  return chapter
}
