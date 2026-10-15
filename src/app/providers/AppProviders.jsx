import { MotionConfig } from 'motion/react'
import { SmoothScroll } from '@/shared/components'
import { LanguageProvider } from '@/shared/i18n'

export function AppProviders({ children }) {
  return (
    <LanguageProvider>
      {/* reducedMotion="user": respeta la preferencia del sistema operativo */}
      <MotionConfig reducedMotion="user">
        <SmoothScroll>{children}</SmoothScroll>
      </MotionConfig>
    </LanguageProvider>
  )
}
