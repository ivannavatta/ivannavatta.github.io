/** Convierte "Texto con *palabras destacadas*" en segmentos (lo destacado va en serif itálica). */
export function toSegments(text) {
  return text.split('*').map((part, index) => ({ text: part, className: index % 2 === 1 ? 'serif' : '' }))
}
