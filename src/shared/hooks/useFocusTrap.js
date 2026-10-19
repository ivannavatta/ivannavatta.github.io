import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const EMPTY = []

/**
 * Mantiene el foco dentro de un diálogo mientras está activo:
 * - al activarse enfoca `initialFocusRef` (o el primer elemento enfocable),
 * - Tab / Shift+Tab ciclan dentro del contenedor,
 * - Escape llama a `onEscape`,
 * - al desactivarse devuelve el foco al elemento que lo tenía antes de abrir.
 * `includeRefs`: elementos de afuera que forman parte del ciclo (ej. el botón que cierra el menú).
 *
 * Devuelve el ref que hay que asignar al contenedor del diálogo.
 */
export function useFocusTrap(active, { initialFocusRef, onEscape, includeRefs = EMPTY } = {}) {
  const containerRef = useRef(null)
  const onEscapeRef = useRef(onEscape)

  useEffect(() => {
    onEscapeRef.current = onEscape
  }, [onEscape])

  useEffect(() => {
    if (!active) return undefined

    const previouslyFocused = document.activeElement
    const extras = includeRefs.map((ref) => ref.current).filter(Boolean)
    const getFocusable = () =>
      [...extras, ...(containerRef.current?.querySelectorAll(FOCUSABLE) ?? [])].filter(
        (element) => element.getClientRects().length > 0,
      )
    const isInside = (element) =>
      containerRef.current?.contains(element) || extras.some((extra) => extra.contains(element))

    // Esperamos un frame para que el contenido animado ya esté montado
    const frame = requestAnimationFrame(() => {
      const target = initialFocusRef?.current ?? getFocusable()[0] ?? containerRef.current
      target?.focus({ preventScroll: true })
    })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onEscapeRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = getFocusable()
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const insideContainer = isInside(document.activeElement)

      if (event.shiftKey && (document.activeElement === first || !insideContainer)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !insideContainer)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [active, initialFocusRef, includeRefs])

  return containerRef
}
