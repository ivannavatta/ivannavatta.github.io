import { useEffect } from 'react'
import { SURFACE_ATTR, THEMES } from '@/shared/stage'

/**
 * Tema discreto de la cabecera: copia <html data-surface> (lo escribe la escena) en
 * data-nav del header. El cambio es instantáneo: durante dos cuadros se apagan las
 * transiciones (flipClass) para que nunca haya un cuadro con texto y fondo parecidos.
 * Es imperativo a propósito: no re-renderiza la nav en cada cambio de capítulo.
 */
export function useSurfaceTheme(headerRef, flipClass) {
  useEffect(() => {
    const header = headerRef.current
    const root = document.documentElement
    if (!header) return undefined
    let frame = 0
    const sync = () => {
      const theme = root.getAttribute(SURFACE_ATTR) || THEMES.light
      if (header.dataset.nav === theme) return
      header.classList.add(flipClass)
      header.dataset.nav = theme
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => header.classList.remove(flipClass))
      })
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: [SURFACE_ATTR] })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [headerRef, flipClass])
}
