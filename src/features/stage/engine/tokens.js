// Lee los tokens de color de src/shared/styles/tokens.css: una sola fuente de verdad
// para el CSS, el tema de la cabecera y el material de los bloques.

export function cssColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

