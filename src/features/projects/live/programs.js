/**
 * Programas con "Probar en vivo", por id de caso (data/projects.js, `live: true`).
 *
 * create: crea el worker de ese programa. Van escritos uno por uno porque Vite solo empaqueta un
 *   worker cuando ve `new Worker(new URL('…', import.meta.url))` con la ruta literal.
 * restart: cómo se reinicia.
 *   'message' (por defecto): se le avisa al mismo worker, que relanza el programa sin volver a
 *     cargar el runtime (Python: runtime.js).
 *   'respawn': se descarta el worker y se crea otro. Para programas cuyo estado no se puede
 *     limpiar en el mismo runtime (Java: los campos static de Main).
 */
export const LIVE_PROGRAMS = {
  transporte: {
    create: () => new Worker(new URL('./transporte.worker.js', import.meta.url), { type: 'module' }),
    restart: 'respawn',
  },
  uadehub: {
    create: () => new Worker(new URL('./uadehub.worker.js', import.meta.url), { type: 'module' }),
  },
  box9: {
    create: () => new Worker(new URL('./box9.worker.js', import.meta.url), { type: 'module' }),
  },
}
