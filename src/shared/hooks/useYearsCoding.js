import { profile } from '../data/profile'

/** Años programando calculados desde profile.startYear (nunca queda desactualizado). */
export function useYearsCoding(startYear = profile.startYear) {
  return Math.max(1, new Date().getFullYear() - startYear)
}
