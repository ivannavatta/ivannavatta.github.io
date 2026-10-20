import { Stage } from '@/features/stage'
import { ChapterPlaceholders } from './placeholders/ChapterPlaceholders'
import { HeroPlaceholder } from './placeholders/HeroPlaceholder'
import { AppProviders } from './providers/AppProviders'

// Ronda 0: base visual, scroll y escena. Las secciones son provisorias (./placeholders)
// y se reemplazan por sus features ronda por ronda: navigation, hero, about, projects,
// skills, education y contact.
export function App() {
  return (
    <AppProviders>
      <a className="skip" href="#perfil">
        Saltar al contenido
      </a>
      <main id="main">
        <HeroPlaceholder />
        <ChapterPlaceholders />
      </main>
      {/* Después de <main>: la escena mide las secciones ya montadas */}
      <Stage />
    </AppProviders>
  )
}
