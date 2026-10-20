// Hilo conductor: trazas de circuito de fondo y la ruta de acento que baja por el margen
// y se conecta con el título de cada capítulo. Con escena viva, la ruta se dibuja con la lectura.
// Se construye con createElementNS (sin innerHTML: lo exige la política de seguridad).
import { MOBILE_QUERY, selectors } from '@/shared/stage'
import { traceNet } from '@/shared/utils/traceNet'

const SVG_NS = 'http://www.w3.org/2000/svg'
const NET_SEED = 7

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value))
  return el
}

const pad = (x, y, className) => svgEl('rect', { class: className, x: x - 3, y: y - 3, width: 6, height: 6 })

export function createTraceLayer(svg, { live, classes }) {
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
    let d = `M${x0} ${window.innerHeight}`
    const nodes = []
    Array.from(document.querySelectorAll(selectors.chapters))
      .slice(1)
      .forEach((section) => {
        const head = section.querySelector('h2')
        const top = section.getBoundingClientRect().top - mainTop
        const hy = head ? head.getBoundingClientRect().top - mainTop + 8 : top + 160
        d += `L${x0} ${hy - 40}L${x0 + jog} ${hy - 40 + jog}L${x0 + jog} ${hy + 40}L${x0} ${hy + 40 + jog}`
        nodes.push(svgEl('rect', { class: classes.node, x: (x0 + jog - 3).toFixed(1), y: hy + 8, width: 6, height: 6 }))
      })
    d += `L${x0} ${h - 40}`

    const net = traceNet(w, h, NET_SEED, mobile ? 34 : 26)
    const fragment = document.createDocumentFragment()
    fragment.append(svgEl('path', { class: classes.net, d: net.d }))
    for (const [x, y] of net.pads) fragment.append(pad(x, y, classes.pad))
    route = svgEl('path', { class: classes.route, d })
    fragment.append(route, ...nodes)
    svg.replaceChildren(fragment)

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
