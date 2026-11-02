/**
 * Núcleo de los Web Workers de "Probar en vivo": Python (Pyodide) corre en un worker para no
 * trabar el scroll ni la escena 3D del hilo principal. Cada programa tiene su worker de entrada
 * (uadehub.worker.js, box9.worker.js) que importa su main.py y llama a startProgramWorker.
 *
 * Protocolo (postMessage):
 *   interfaz → worker  { type: 'start', indexURL }   carga Pyodide (una vez) y lanza main.py
 *                      { type: 'line', value }       la línea que escribió el usuario
 *                      { type: 'restart', epoch }    cancela el input pendiente y relanza main.py
 *                                                    con los datos semilla (sin recargar Pyodide)
 *   Los mensajes del programa (out, err, input, done, error) llevan la época del reinicio que los
 *   lanzó; la interfaz descarta los de una época vieja que lleguen tarde (doble clic en Reiniciar).
 *   worker → interfaz  { type: 'ready' }             Pyodide listo; el programa arranca
 *                      { type: 'out' | 'err', text } salida estándar y de error
 *                      { type: 'input' }             el programa espera una línea
 *                      { type: 'done' }              el programa terminó
 *                      { type: 'error', message }    el programa terminó con una excepción
 *                      { type: 'boot-error', message } no se pudo cargar Pyodide
 */
import BOOT from './boot.py?raw'

/**
 * @param {object} program
 * @param {string} program.main   código de main.py
 * @param {(fs: object) => void} [program.seed]  escribe los archivos de datos antes de cada ejecución
 */
export function startProgramWorker({ main, seed }) {
  let py = null
  let runProgram = null
  let booting = null
  let pending = null
  let run = 0 // id de la ejecución vigente; un reinicio lo incrementa y deja vieja a la anterior
  let current = null // promesa de la ejecución en curso (launch nunca rechaza)
  let muted = false // silencia la salida de una ejecución vieja mientras termina
  let epoch = 0 // época de la interfaz para la ejecución vigente: va en cada mensaje del programa

  const post = (msg) => self.postMessage(msg)
  /** Mensajes del programa: llevan su época para que la interfaz descarte los de un reinicio viejo. */
  const emit = (msg) => post({ ...msg, epoch })

  /** input() de Python: avisa a la interfaz y espera su línea. Si la ejecución ya es vieja, la corta. */
  function ask(id) {
    if (id !== run) return Promise.reject(new Error('reinicio'))
    return new Promise((resolve, reject) => {
      pending = { resolve, reject }
      emit({ type: 'input' })
    })
  }

  async function boot(indexURL) {
    const { loadPyodide } = await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`)
    const pyodide = await loadPyodide({ indexURL })
    const out = new TextDecoder()
    const err = new TextDecoder()
    pyodide.setStdout({
      write: (buf) => {
        const text = out.decode(buf, { stream: true })
        if (!muted) emit({ type: 'out', text })
        return buf.length
      },
    })
    pyodide.setStderr({
      write: (buf) => {
        const text = err.decode(buf, { stream: true })
        if (!muted) emit({ type: 'err', text })
        return buf.length
      },
    })
    await pyodide.runPythonAsync(BOOT)
    py = pyodide
    runProgram = pyodide.globals.get('_run')
  }

  async function launch(id) {
    seed?.(py.FS)
    try {
      await runProgram(main, () => ask(id))
      if (id === run) emit({ type: 'done' })
    } catch (error) {
      if (id !== run) return // se reinició: la ejecución vieja termina sola, sin avisar
      emit({ type: 'error', message: String(error?.message || error) })
    }
  }

  /**
   * Reinicio en serie: invalida la ejecución vigente, la corta (si espera una línea, ya; si no, en
   * su próximo input()), espera a que termine en silencio y recién ahí relanza. Si llegan varios
   * reinicios seguidos, solo el último relanza: nunca corren dos main.py a la vez.
   */
  async function restart(nextEpoch) {
    const id = ++run
    muted = true
    if (pending) {
      const p = pending
      pending = null
      p.reject(new Error('reinicio'))
    }
    await current
    if (id !== run) return
    epoch = nextEpoch
    muted = false
    current = launch(id)
  }

  self.onmessage = ({ data }) => {
    switch (data?.type) {
      case 'start':
        if (py || booting) return
        booting = boot(data.indexURL).then(
          () => {
            post({ type: 'ready' })
            current = launch(++run)
          },
          (error) => {
            booting = null
            post({ type: 'boot-error', message: String(error?.message || error) })
          },
        )
        return
      case 'line':
        if (pending) {
          const p = pending
          pending = null
          p.resolve(String(data.value ?? ''))
        }
        return
      case 'restart':
        if (!py) return
        restart(data.epoch)
        return
    }
  }
}
