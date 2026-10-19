import { FaDatabase, FaJava, FaPeopleGroup } from 'react-icons/fa6'
import { SiCss, SiGit, SiHtml5, SiJavascript, SiMongodb, SiPython, SiReact } from 'react-icons/si'

/**
 * Catálogo de tecnologías que manejás (nombre, ícono y color de marca).
 * Lo usa la sección Skills (src/features/skills/data/skills.js).
 */
export const technologies = {
  html: { name: 'HTML', icon: SiHtml5, color: '#E34F26' },
  css: { name: 'CSS', icon: SiCss, color: '#2965F1' },
  javascript: { name: 'JavaScript', icon: SiJavascript, color: '#F7DF1E' },
  react: { name: 'React', icon: SiReact, color: '#61DAFB' },
  java: { name: 'Java', icon: FaJava, color: '#F89820' },
  python: { name: 'Python', icon: SiPython, color: '#FFD43B' },
  sql: { name: 'SQL', icon: FaDatabase, color: '#4FA3E0' },
  nosql: { name: 'NoSQL', icon: SiMongodb, color: '#47A248' },
  git: { name: 'Git', icon: SiGit, color: '#F05032' },
  scrum: { name: 'Scrum', icon: FaPeopleGroup, color: '#34D399' },
}

export const technologyList = Object.values(technologies)
