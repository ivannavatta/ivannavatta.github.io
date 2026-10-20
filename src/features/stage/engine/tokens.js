// Lee los tokens de color de src/shared/styles/tokens.css: una sola fuente de verdad
// para el CSS, la mezcla de temas y el material de los bloques.

export function cssColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((ch) => ch + ch).join('') : h
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}
