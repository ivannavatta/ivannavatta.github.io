// Tres trazas de 2 px con su pad de 4 px; al abrir, las trazas de afuera se cruzan en X
// y los tres pads se juntan en el cruce (animado en Navbar.module.css).
export function BurgerIcon({ className }) {
  return (
    <span className={className} aria-hidden="true">
      <b />
      <b />
      <b />
      <i />
      <i />
      <i />
    </span>
  )
}
