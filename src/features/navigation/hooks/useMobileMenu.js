import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFocusTrap } from '@/shared/hooks/useFocusTrap'
import { useScroll } from '@/shared/scroll'

/** Todo lo que no es la cabecera (salto, main, escena) queda inerte mientras el menú está abierto. */
function setPageInert(header, inert) {
  for (const el of header.parentElement?.children ?? []) if (el !== header) el.inert = inert
}

/**
 * Menú mobile (disclosure): foco atrapado entre el IN, el botón y el panel; Esc cierra y
 * devuelve el foco al botón; el resto de la página queda inerte y sin scroll (Lenis detenido).
 * Los efectos se aplican en el mismo handler (no en un efecto) para que, al tocar un link,
 * la página ya esté activa cuando el foco salta al título de destino.
 */
export function useMobileMenu({ headerRef, logoRef, toggleRef, mobile, flipClass }) {
  const { lockScroll } = useScroll()
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  const includeRefs = useMemo(() => [logoRef, toggleRef], [logoRef, toggleRef])

  const setMenu = useCallback(
    (next, { returnFocus = true, instant = false } = {}) => {
      if (next === openRef.current) return
      openRef.current = next
      const header = headerRef.current
      if (header) {
        if (instant) {
          header.classList.add(flipClass)
          requestAnimationFrame(() => requestAnimationFrame(() => header.classList.remove(flipClass)))
        }
        setPageInert(header, next)
      }
      lockScroll(next)
      setOpen(next)
      if (!next && returnFocus) toggleRef.current?.focus()
    },
    [headerRef, toggleRef, flipClass, lockScroll],
  )

  const onEscape = useCallback(() => setMenu(false), [setMenu])
  // restoreFocus: false: adónde va el foco al cerrar lo decide setMenu (botón o título de destino)
  const panelRef = useFocusTrap(open, { initialFocusRef: toggleRef, onEscape, includeRefs, restoreFocus: false })

  // Si la ventana pasa a escritorio con el menú abierto, se cierra sin animación
  useEffect(() => {
    if (!mobile && openRef.current) setMenu(false, { returnFocus: false, instant: true })
  }, [mobile, setMenu])

  // Al desmontar, la página no puede quedar inerte ni bloqueada
  useEffect(
    () => () => {
      if (openRef.current) setMenu(false, { returnFocus: false })
    },
    [setMenu],
  )

  return { open, setMenu, panelRef }
}
