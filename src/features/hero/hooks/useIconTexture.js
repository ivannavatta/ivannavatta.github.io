import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { SRGBColorSpace, TextureLoader } from 'three'

const loader = new TextureLoader()

const toKebab = (name) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)

/** Serializa el árbol de elementos de un ícono de react-icons (path, circle, g...) a SVG. */
function serialize(node, color) {
  if (!node || typeof node.type !== 'string') return ''
  const { children, ...props } = node.props ?? {}
  const attrs = Object.entries(props)
    .map(([key, value]) => `${toKebab(key)}="${String(value).replace('currentColor', color)}"`)
    .join(' ')
  const inner = []
    .concat(children ?? [])
    .map((child) => serialize(child, color))
    .join('')
  return `<${node.type} ${attrs}>${inner}</${node.type}>`
}

function iconToSvg(Icon, color, size) {
  const element = Icon({})
  const { viewBox } = element.props.attr ?? {}
  const children = [].concat(element.props.children ?? [])
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" fill="${color}" stroke="${color}" stroke-width="0">${children.map((child) => serialize(child, color)).join('')}</svg>`
}

/** Convierte un ícono de react-icons en una textura de three.js. */
export function useIconTexture(Icon, color, size = 256) {
  const invalidate = useThree((state) => state.invalidate)

  const texture = useMemo(() => {
    const svg = iconToSvg(Icon, color, size)
    // invalidate: vuelve a dibujar al cargar (necesario si la escena está en pausa / reduced motion)
    const map = loader.load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, () => invalidate())
    map.colorSpace = SRGBColorSpace
    map.anisotropy = 4
    return map
  }, [Icon, color, size, invalidate])

  useEffect(() => () => texture.dispose(), [texture])

  return texture
}
