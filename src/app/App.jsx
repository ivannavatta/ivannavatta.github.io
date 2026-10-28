import { About } from '@/features/about'
import { Contact } from '@/features/contact'
import { Education } from '@/features/education'
import { Hero } from '@/features/hero'
import { Navbar } from '@/features/navigation'
import { Projects } from '@/features/projects'
import { Skills } from '@/features/skills'
import { Stage } from '@/features/stage'
import { AppProviders } from './providers/AppProviders'

export function App() {
  return (
    <AppProviders>
      <a className="skip" href="#perfil">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <About />
        <Projects />
        <Skills />
        <Education />
        <Contact />
      </main>
      {/* Después de <main>: la escena mide las secciones ya montadas */}
      <Stage />
    </AppProviders>
  )
}
