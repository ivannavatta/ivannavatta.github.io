import { createContext } from 'react'

export const SmoothScrollContext = createContext({
  scrollTo: () => {},
  lockScroll: () => {},
  unlockScroll: () => {},
})
