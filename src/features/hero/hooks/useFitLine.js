import { useEffect } from 'react'
import { MOBILE_QUERY } from '@/shared/stage'

const RESIZE_DEBOUNCE = 160

/**
 * Ajusta el tamaño de letra para que el texto ocupe el ancho de su contenedor en una línea
 * (con tope en maxPx). En mobile no hace nada: ahí el CSS parte el nombre en dos líneas.
 * Mide con Range (el ancho real del texto), no con scrollWidth del bloque.
 */
function fitLine(el, maxPx) {
  el.style.fontSize = ''
  if (window.matchMedia(MOBILE_QUERY).matches) return
  const parent = el.parentElement
  const cs = getComputedStyle(parent)
  const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
  const prev = el.style.whiteSpace
  el.style.whiteSpace = 'nowrap'
  const range = document.createRange()
  range.selectNodeContents(el)
  const width = range.getBoundingClientRect().width
  const size = parseFloat(getComputedStyle(el).fontSize)
  el.style.whiteSpace = prev
  if (width > 0) el.style.fontSize = `${Math.min(maxPx, ((size * avail) / width) * 0.99)}px`
}

export function useFitLine(ref, maxPx) {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    let alive = true
    let timer = 0
    const fit = () => {
      if (alive) fitLine(el, maxPx)
    }
    fit()
    document.fonts?.ready.then(fit)
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(fit, RESIZE_DEBOUNCE)
    }
    window.addEventListener('resize', onResize)
    return () => {
      alive = false
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [ref, maxPx])
}
