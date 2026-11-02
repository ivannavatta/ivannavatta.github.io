/**
 * Programas con "Probar en vivo", por id de caso (data/projects.js, `live: true`).
 * Cada entrada crea el worker de ese programa. Van escritas una por una porque Vite solo empaqueta
 * un worker cuando ve `new Worker(new URL('…', import.meta.url))` con la ruta literal.
 */
export const LIVE_PROGRAMS = {
  uadehub: () => new Worker(new URL('./uadehub.worker.js', import.meta.url), { type: 'module' }),
  box9: () => new Worker(new URL('./box9.worker.js', import.meta.url), { type: 'module' }),
}
