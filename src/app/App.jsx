import { About } from '@/features/about'
import { Hero } from '@/features/hero'
import { Navbar } from '@/features/navigation'
import { Projects } from '@/features/projects'
import { Skills } from '@/features/skills'
import { Stage } from '@/features/stage'
import { ChapterPlaceholders } from './placeholders/ChapterPlaceholders'
import { AppProviders } from './providers/AppProviders'

// Las secciones que todavía son provisorias (./placeholders) se reemplazan por sus
// features ronda por ronda: education y contact.
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
        <ChapterPlaceholders />
      </main>
      {/* Después de <main>: la escena mide las secciones ya montadas */}
      <Stage />
    </AppProviders>
  )
}
