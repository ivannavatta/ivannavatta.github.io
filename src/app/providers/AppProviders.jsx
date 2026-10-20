import { ScrollProvider } from '@/shared/scroll'

export function AppProviders({ children }) {
  return <ScrollProvider>{children}</ScrollProvider>
}
