import { About } from '@/features/about'
import { Contact } from '@/features/contact'
import { Timeline } from '@/features/education'
import { Hero } from '@/features/hero'
import { Navbar } from '@/features/navigation'
import { Projects } from '@/features/projects'
import { Skills } from '@/features/skills'
import { Footer } from '@/shared/components'
import { AppProviders } from './providers/AppProviders'

export function App() {
  return (
    <AppProviders>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Timeline />
        <Contact />
      </main>
      <Footer />
    </AppProviders>
  )
}
