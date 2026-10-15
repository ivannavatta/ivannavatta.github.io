import { technologies } from '@/shared/data/technologies'

const { html, css, javascript, react, java, python, sql, nosql, git, scrum } = technologies

/**
 * Tecnologías agrupadas por categoría (el catálogo está en shared/data/technologies.js).
 * Los textos de cada categoría están en ../i18n.
 */
export const skillCategories = [
  { id: 'frontend', skills: [html, css, javascript, react] },
  { id: 'backend', skills: [java, python] },
  { id: 'data', skills: [sql, nosql] },
  { id: 'tools', skills: [git, scrum] },
]

export const allSkills = skillCategories.flatMap((category) => category.skills)
