// Hilo conductor: trazas de circuito de fondo y la ruta de acento que baja por el margen
// y se conecta con el título de cada capítulo. Con escena viva, la ruta se dibuja con la lectura.
// La red y la ruta se dibujan una vez (en <defs>) y se muestran por capítulo con <use>,
// recortadas a la franja de cada sección y en los colores de SU tema: las trazas cruzan el
// borde entre capítulos sin depender de una mezcla global de colores.
// Se construye con createElementNS (sin innerHTML: lo exige la política de seguridad).
import { MOBILE_QUERY, THEMES, selectors } from '@/shared/stage'
import { traceNet } from '@/shared/utils/traceNet'
import { effectiveTheme } from './theme'

const SVG_NS = 'http://www.w3.org/2000/svg'
const NET_SEED = 7
let instance = 0 // ids únicos (StrictMode monta dos veces)

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value))
  return el
}

const pad = (x, y, className) => svgEl('rect', { class: className, x: x - 3, y: y - 3, width: 6, height: 6 })

export function createTraceLayer(svg, { live, classes }) {
  const uid = `stage-${++instance}`
  let route = null
  let routeLen = 0
  let lastOffset = ''

  function draw() {
    const main = document.querySelector('main')
    if (!main) return
    const mobile = window.matchMedia(MOBILE_QUERY).matches
    const w = document.documentElement.clientWidth
    const h = main.scrollHeight
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svg.style.height = `${h}px`

    // El margen exterior (--m) resuelto en px: el svg lo lleva en scroll-margin-left (ver CSS)
    const m = parseFloat(getComputedStyle(svg).scrollMarginLeft) || 16
    const x0 = m * 0.35
    const jog = m * 0.3
    const mainTop = main.getBoundingClientRect().top
    const sections = Array.from(document.querySelectorAll(selectors.chapters))

    // Ruta de acento: baja por el margen y hace un quiebre en el título de cada capítulo
    let d = `M${x0} ${window.innerHeight}`
    const nodes = []
    sections.slice(1).forEach((section) => {
      const head = section.querySelector('h2')
      const top = section.getBoundingClientRect().top - mainTop
      const hy = head ? head.getBoundingClientRect().top - mainTop + 8 : top + 160
      d += `L${x0} ${hy - 40}L${x0 + jog} ${hy - 40 + jog}L${x0 + jog} ${hy + 40}L${x0} ${hy + 40 + jog}`
      nodes.push(pad(x0 + jog, hy + 11, classes.node))
    })
    d += `L${x0} ${h - 40}`

    const defs = svgEl('defs')
    const netGroup = svgEl('g', { id: `${uid}-net` })
    const net = traceNet(w, h, NET_SEED, mobile ? 34 : 26)
    netGroup.append(svgEl('path', { class: classes.net, d: net.d }))
    for (const [x, y] of net.pads) netGroup.append(pad(x, y, classes.pad))
    const routeGroup = svgEl('g', { id: `${uid}-route` })
    route = svgEl('path', { class: classes.route, d })
    routeGroup.append(route, ...nodes)
    defs.append(netGroup, routeGroup)

    // Una franja por capítulo, con los colores de su tema
    const layers = []
    sections.forEach((section, i) => {
      const r = section.getBoundingClientRect()
      const clip = svgEl('clipPath', { id: `${uid}-clip-${i}` })
      clip.append(svgEl('rect', { x: 0, y: r.top - mainTop, width: w, height: r.height }))
      defs.append(clip)
      const theme = effectiveTheme(section)
      const layer = svgEl('g', {
        'clip-path': `url(#${uid}-clip-${i})`,
        class: theme === THEMES.dark ? classes.onDark : classes.onLight,
      })
      layer.append(svgEl('use', { href: `#${uid}-net` }), svgEl('use', { href: `#${uid}-route` }))
      layers.push(layer)
    })
    svg.replaceChildren(defs, ...layers)

    routeLen = route.getTotalLength()
    lastOffset = ''
    if (live) {
      route.style.strokeDasharray = `${routeLen}`
      route.style.strokeDashoffset = `${routeLen}`
    }
  }

  /** p: avance de lectura de toda la página, 0–1 */
  function setProgress(p) {
    if (!route) return
    const offset = (routeLen * (1 - p)).toFixed(1)
    if (offset === lastOffset) return
    lastOffset = offset
    route.style.strokeDashoffset = offset
  }

  function dispose() {
    svg.replaceChildren()
    svg.removeAttribute('viewBox')
    svg.style.height = ''
    route = null
  }

  return { draw, setProgress, dispose }
}
