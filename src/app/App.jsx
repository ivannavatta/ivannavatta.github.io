import { AnimatePresence } from 'motion/react'
import { useCallback, useState } from 'react'
import { About } from '@/features/about'
import { Contact } from '@/features/contact'
import { Timeline } from '@/features/education'
import { Hero } from '@/features/hero'
import { Navbar } from '@/features/navigation'
import { Projects } from '@/features/projects'
import { Skills } from '@/features/skills'
import { CustomCursor, Footer, Loader } from '@/shared/components'
import { AppProviders } from './providers/AppProviders'

export function App() {
  const [loading, setLoading] = useState(true)
  const finishLoading = useCallback(() => setLoading(false), [])

  return (
    <AppProviders>
      <AnimatePresence>{loading && <Loader key="loader" onComplete={finishLoading} />}</AnimatePresence>
      <CustomCursor />
      <Navbar />
      <main>
        <Hero ready={!loading} />
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
