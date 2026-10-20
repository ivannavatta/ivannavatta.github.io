import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Una sola instancia registrada para toda la app: las features importan gsap y
// ScrollTrigger desde acá para compartir el ticker que también mueve Lenis.
gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
