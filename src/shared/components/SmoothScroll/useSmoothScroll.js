import { useContext } from 'react'
import { SmoothScrollContext } from './smoothScrollContext'

export function useSmoothScroll() {
  return useContext(SmoothScrollContext)
}
