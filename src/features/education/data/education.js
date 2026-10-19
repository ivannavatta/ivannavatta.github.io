/**
 * Formación y trayectoria (de lo más reciente a lo más antiguo).
 * Agregá acá experiencia laboral cuando la tengas.
 * type: 'education' | 'experience' | 'course' (dato descriptivo; hoy no cambia la vista)
 */
export const timeline = [
  {
    id: 'uade',
    type: 'education',
    period: { es: 'Mar. 2025 — Actualidad', en: 'Mar. 2025 — Present' },
    title: {
      es: 'Lic. en Gestión de la Tecnología de la Información',
      en: 'B.S. in Information Technology Management',
    },
    place: 'UADE · Universidad Argentina de la Empresa',
    description: {
      es: 'Carrera que integra el desarrollo de software y el análisis de sistemas con la gestión de negocios: programación, bases de datos, infraestructura tecnológica y gestión de proyectos.',
      en: 'A degree that integrates software development and systems analysis with business management: programming, databases, IT infrastructure and project management.',
    },
    tags: {
      es: ['Desarrollo de software', 'Análisis de sistemas', 'Bases de datos', 'Gestión de proyectos TI'],
      en: ['Software development', 'Systems analysis', 'Databases', 'IT project management'],
    },
  },
  {
    id: 'coderhouse',
    type: 'course',
    period: { es: 'Jun. 2023 — May. 2024', en: 'Jun. 2023 — May. 2024' },
    title: {
      es: 'Formación en Desarrollo Web y Backend',
      en: 'Web & Backend Development Training',
    },
    place: 'Coderhouse',
    description: {
      es: 'Ruta de cursos intensivos antes de la universidad: desarrollo web, JavaScript, React (egresado en el Top 10 del curso) y programación backend. Casi 200 horas de formación práctica.',
      en: 'A path of intensive courses before university: web development, JavaScript, React (graduated in the course Top 10) and backend programming. Nearly 200 hours of hands-on training.',
    },
    tags: {
      es: ['Desarrollo Web', 'JavaScript', 'React Js', 'Programación Backend'],
      en: ['Web Development', 'JavaScript', 'React Js', 'Backend Programming'],
    },
  },
]
