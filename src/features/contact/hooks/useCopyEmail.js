import { useCallback, useEffect, useRef, useState } from 'react'

const RESET_MS = 2200

/** Copia con la API del portapapeles y, si no está (http, permisos), con execCommand. */
async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.className = 'sr-only'
    document.body.appendChild(area)
    area.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    area.remove()
    return ok
  }
}

/**
 * "Copiar email": state es idle | done | failed. Vuelve a idle a los 2,2 s.
 * El aviso para lectores de pantalla vive mientras state no es idle: al volver a idle se vacía y el
 * próximo intento se anuncia de nuevo.
 */
export function useCopyEmail(text) {
  const [state, setState] = useState('idle')
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(async () => {
    const ok = await writeClipboard(text)
    setState(ok ? 'done' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), RESET_MS)
  }, [text])

  return { state, copy }
}
