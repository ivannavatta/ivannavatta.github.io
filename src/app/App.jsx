import { Navbar } from '@/features/navigation'
import { Stage } from '@/features/stage'
import { ChapterPlaceholders } from './placeholders/ChapterPlaceholders'
import { HeroPlaceholder } from './placeholders/HeroPlaceholder'
import { AppProviders } from './providers/AppProviders'

// Las secciones que todavía son provisorias (./placeholders) se reemplazan por sus
// features ronda por ronda: hero, about, projects, skills, education y contact.
export function App() {
  return (
    <AppProviders>
      <a className="skip" href="#perfil">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="main">
        <HeroPlaceholder />
        <ChapterPlaceholders />
      </main>
      {/* Después de <main>: la escena mide las secciones ya montadas */}
      <Stage />
    </AppProviders>
  )
}
