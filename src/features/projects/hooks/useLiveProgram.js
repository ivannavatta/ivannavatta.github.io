import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const NEAR_BOTTOM = 48 // px: si el usuario subió más que esto para releer, la salida no lo arrastra

/** Pyodide se sirve desde el propio sitio (scripts/copy-pyodide.mjs), respetando la base de Vite. */
const pyodideURL = () => new URL(`${import.meta.env.BASE_URL}pyodide/`, document.baseURI).href

/**
 * Corre main.py de uadeHUB en un Web Worker (ver live/uadehub.worker.js) y lo conecta con una
 * terminal: la salida se escribe directo en el DOM (sin un render por línea) y el input en línea
 * manda cada respuesta al worker.
 *
 * El worker se crea al montar: el componente que usa este hook se carga con React.lazy recién
 * cuando se toca "Probar en vivo", así Pyodide no se descarga antes.
 *
 * Foco: el input toma el foco solo si el usuario está usando la demo (el foco está en ella o en
 * su botón) y la terminal se ve; si se fue a otra parte de la página mientras cargaba, no lo
 * traemos de vuelta. Entre una respuesta y la siguiente el input queda readOnly (no disabled),
 * así el foco no se pierde en cada Enter.
 *
 * phase: 'loading' | 'boot-error' | 'running' | 'done' | 'error'
 */
export function useLiveProgram({ regionRef, termRef, textRef, inputRef, restartRef, copy }) {
  const [phase, setPhase] = useState('loading')
  const workerRef = useRef(null)
  const waitingRef = useRef(false)
  // Época del reinicio vigente: los mensajes del worker de una época anterior que lleguen tarde
  // (después de limpiar la terminal) se descartan
  const epochRef = useRef(0)

  const write = useCallback(
    (str, cls) => {
      const term = termRef.current
      const text = textRef.current
      if (!term || !text || !str) return
      const stick = term.scrollHeight - term.scrollTop - term.clientHeight < NEAR_BOTTOM
      if (cls) {
        const span = document.createElement('span')
        span.className = cls
        span.textContent = str
        text.append(span)
      } else if (text.lastChild && text.lastChild.nodeType === Node.TEXT_NODE) {
        text.lastChild.appendData(str)
      } else {
        text.append(str)
      }
      if (stick) term.scrollTop = term.scrollHeight
    },
    [termRef, textRef],
  )

  const canTakeFocus = useCallback(() => {
    const region = regionRef.current
    const term = termRef.current
    if (!region || !term || region.hidden) return false
    const a = document.activeElement
    const engaged = !a || a === document.body || region.contains(a) || a.getAttribute('aria-controls') === region.id
    if (!engaged) return false
    const r = term.getBoundingClientRect()
    return r.bottom > 0 && r.top < window.innerHeight
  }, [regionRef, termRef])

  /** El programa terminó: el input se apaga y, si tenía el foco, pasa a "Reiniciar". */
  const stopInput = useCallback(() => {
    const input = inputRef.current
    if (!input) return
    waitingRef.current = false
    const hadFocus = document.activeElement === input
    input.disabled = true
    input.readOnly = false
    if (hadFocus) restartRef.current?.focus({ preventScroll: true })
  }, [inputRef, restartRef])

  const connect = useCallback(() => {
    workerRef.current?.terminate()
    const worker = new Worker(new URL('../live/uadehub.worker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker
    epochRef.current = 0

    worker.onmessage = ({ data }) => {
      if (data && 'epoch' in data && data.epoch !== epochRef.current) return
      switch (data?.type) {
        case 'ready':
          setPhase('running')
          return
        case 'out':
          write(data.text)
          return
        case 'err':
          write(data.text, 'err')
          return
        case 'input': {
          const input = inputRef.current
          if (!input) return
          waitingRef.current = true
          input.disabled = false
          input.readOnly = false
          input.value = ''
          if (canTakeFocus()) input.focus({ preventScroll: true })
          const term = termRef.current
          if (term) term.scrollTop = term.scrollHeight
          return
        }
        case 'done':
          stopInput()
          write(`\n${copy.finished} `, 'sys')
          setPhase('done')
          return
        case 'error':
          stopInput()
          write(`\n${data.message}\n`, 'err')
          setPhase('error')
          return
        case 'boot-error':
          console.warn('[uadeHUB en vivo] no se pudo cargar Python:', data.message)
          setPhase('boot-error')
          return
      }
    }
    // El script del worker no cargó (sin red, por ejemplo): mismo estado que un error de carga
    worker.onerror = (e) => {
      e.preventDefault()
      setPhase('boot-error')
    }
    worker.postMessage({ type: 'start', indexURL: pyodideURL() })
  }, [write, canTakeFocus, stopInput, inputRef, termRef, copy])

  // El input arranca apagado (se prende cuando el programa pide una línea)
  useLayoutEffect(() => {
    if (inputRef.current) inputRef.current.disabled = true
  }, [inputRef])

  useEffect(() => {
    connect()
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [connect])

  /** Enter: la línea se copia en la salida y va al worker. */
  const onKeyDown = useCallback(
    (e) => {
      if (e.key !== 'Enter' || !waitingRef.current) return
      e.preventDefault()
      const input = e.currentTarget
      const line = input.value
      waitingRef.current = false
      input.readOnly = true
      input.value = ''
      write(line, 'typed')
      write('\n')
      workerRef.current?.postMessage({ type: 'line', value: line })
    },
    [write],
  )

  const restart = useCallback(() => {
    if (textRef.current) textRef.current.textContent = ''
    const input = inputRef.current
    if (input) {
      waitingRef.current = false
      input.disabled = true
    }
    setPhase('running')
    epochRef.current += 1
    workerRef.current?.postMessage({ type: 'restart', epoch: epochRef.current })
  }, [textRef, inputRef])

  /** Click en la terminal: enfoca el input, salvo que el usuario esté seleccionando texto. */
  const focusInput = useCallback(() => {
    const input = inputRef.current
    if (input && !input.disabled && !window.getSelection()?.toString()) input.focus({ preventScroll: true })
  }, [inputRef])

  /** Error de carga: worker nuevo (un import fallido puede quedar en la caché de módulos). */
  const retry = useCallback(() => {
    setPhase('loading')
    connect()
  }, [connect])

  return { phase, restart, retry, onKeyDown, focusInput }
}
