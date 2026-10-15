import { useMemo, useState } from 'react'

export const ALL = 'all'

/** Filtra los proyectos por tecnología y arma la lista de filtros disponibles. */
export function useProjectFilter(projects) {
  const [active, setActive] = useState(ALL)

  const filters = useMemo(() => {
    const techs = new Set(projects.flatMap((project) => project.tech))
    return [ALL, ...techs]
  }, [projects])

  const filtered = useMemo(
    () => (active === ALL ? projects : projects.filter((project) => project.tech.includes(active))),
    [projects, active],
  )

  return { filters, active, setActive, filtered }
}
