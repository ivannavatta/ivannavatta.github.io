import { createContext } from 'react'
import { REDUCED_MOTION } from './motionPreference'

export const ScrollContext = createContext({
  reduced: REDUCED_MOTION,
  scrollTo: () => {},
  lockScroll: () => {},
  refresh: () => {},
  getLenis: () => null,
})
