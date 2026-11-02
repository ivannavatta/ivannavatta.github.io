/**
 * Worker de "Probar en vivo" para uadeHUB (protocolo y ciclo de vida en runtime.js).
 */
import { startProgramWorker } from './runtime'
// Copia (snapshot) de github.com/ivannavatta/uadeHUB, sin cambios: main.py y pisos.txt.
// Para actualizarla, volver a copiar los dos archivos del repositorio.
import MAIN from './uadehub/main.py?raw'
import PISOS from './uadehub/pisos.txt?raw'

/** Fechas dd-mm de hoy en adelante, como las genera main.py. */
function dates(count) {
  const d = new Date()
  return Array.from({ length: count }, (_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)
    return `${String(x.getDate()).padStart(2, '0')}-${String(x.getMonth() + 1).padStart(2, '0')}`
  })
}

/** Datos semilla en el sistema de archivos en memoria: otros dos estudiantes ya reservaron. */
function seed(fs) {
  const [today, tomorrow] = dates(2)
  fs.writeFile('pisos.txt', PISOS)
  fs.writeFile('clientes.txt', 'Martina Lopez|1100001\nTomas Gomez|1100002\n')
  fs.writeFile(
    'reservas.txt',
    [
      `Piso 10-Uade Comunitario|privados|1|1100001|${today}`,
      `Piso 10-Uade Comunitario|salas|2|1100002|${today}`,
      `Piso 10-UADEHUB|privados|3|1100002|${today}`,
      `Piso Silencioso|salas|1|1100001|${tomorrow}`,
    ].join('\n') + '\n',
  )
}

startProgramWorker({ main: MAIN, seed })
