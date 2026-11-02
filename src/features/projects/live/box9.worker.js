/**
 * Worker de "Probar en vivo" para box9 (protocolo y ciclo de vida en runtime.js).
 * box9 guarda todo en memoria: no hay archivos que sembrar, cada ejecución arranca vacía.
 */
import { startProgramWorker } from './runtime'
// Copia (snapshot) de github.com/ivannavatta/box9, sin cambios: main.py.
// Para actualizarla, volver a copiar el archivo del repositorio.
import MAIN from './box9/main.py?raw'

startProgramWorker({ main: MAIN })
