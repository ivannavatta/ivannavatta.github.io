/**
 * Worker de "Probar en vivo" para el Sistema de transporte (TPO de Java). Habla el mismo protocolo
 * que los workers de Python (ver runtime.js), pero no carga Pyodide: el programa es el Main.java
 * del TPO compilado a JavaScript con TeaVM (scripts/build-transporte.mjs → transporte/teavm/).
 * El JS generado se commitea; si cambia el TPO, se vuelve a correr `npm run transporte`.
 *
 * El lado Java (transporte/web/bridge/WorkerIO.java) llama a cinco funciones globales que se
 * definen acá antes de arrancar: requestLine, writeOut, writeErr, finish y fail.
 *
 * Diferencias con runtime.js:
 *   - 'start' ignora indexURL (no hay nada que descargar aparte de este módulo, unos 75 KB con gzip).
 *   - No hay 'restart': los campos static de Main (el sistema con los datos de prueba y el
 *     Scanner) viven lo que vive este módulo y Java no tiene cómo volver a inicializarlos. La
 *     interfaz reinicia creando un worker nuevo (programs.js: restart 'respawn').
 *   - Por lo mismo, la época de los mensajes siempre es 0: cada worker corre una sola ejecución,
 *     y la interfaz arranca en 0 cada vez que crea uno.
 */
import { main } from './transporte/teavm/classes.js'

let started = false
let pending = null // callback de Java que espera la próxima línea

const emit = (msg) => self.postMessage({ ...msg, epoch: 0 })

// Scanner.nextLine() (TScanner → WorkerIO.readLine): avisa a la interfaz y guarda a quién responder
self.requestLine = (callback) => {
  pending = callback
  emit({ type: 'input' })
}
self.writeOut = (text) => emit({ type: 'out', text })
self.writeErr = (text) => emit({ type: 'err', text })
self.finish = () => emit({ type: 'done' })
self.fail = (message) => emit({ type: 'error', message: String(message) })

self.onmessage = ({ data }) => {
  switch (data?.type) {
    case 'start':
      if (started) return
      started = true
      self.postMessage({ type: 'ready' })
      try {
        main([])
      } catch (error) {
        // Errores del propio runtime de TeaVM; las excepciones de Java las atrapa WebMain
        emit({ type: 'error', message: String(error?.message || error) })
      }
      return
    case 'line':
      if (pending) {
        const answer = pending
        pending = null
        answer(String(data.value ?? ''))
      }
      return
  }
}
