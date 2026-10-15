/**
 * ⭐ Tus proyectos.
 *
 * Reemplazá estos ejemplos por tus proyectos reales. Cada proyecto acepta:
 *  - id:          identificador único (sin espacios)
 *  - title:       { es, en }  nombre del proyecto
 *  - summary:     { es, en }  descripción corta (se ve en la tarjeta)
 *  - description: { es, en }  descripción larga (se ve en el detalle)
 *  - highlights:  { es: [], en: [] }  funcionalidades o logros destacados
 *  - tech:        tecnologías usadas (se usan también para los filtros)
 *  - image:       ruta de una captura en /public (ej: '/projects/mi-proyecto.png') o null
 *  - repo:        link al repositorio (o null)
 *  - demo:        link a la demo online (o null)
 *  - year:        año del proyecto
 *  - featured:    true para destacarlo (ocupa más espacio en la grilla)
 */
export const projects = [
  {
    id: 'proyecto-1',
    title: { es: 'Proyecto de ejemplo 1', en: 'Sample project 1' },
    summary: {
      es: 'Aplicación web full stack. Reemplazá este texto con una descripción corta de tu proyecto.',
      en: 'Full stack web application. Replace this text with a short description of your project.',
    },
    description: {
      es: 'Contá qué problema resuelve el proyecto, para quién es y cuál fue tu rol. Las empresas valoran entender el contexto y el impacto, no solo la tecnología.',
      en: 'Explain what problem the project solves, who it is for and what your role was. Companies value understanding the context and impact, not just the technology.',
    },
    highlights: {
      es: ['Autenticación de usuarios', 'API REST con Java', 'Interfaz responsive en React'],
      en: ['User authentication', 'REST API with Java', 'Responsive React interface'],
    },
    tech: ['React', 'Java', 'SQL'],
    image: null,
    repo: 'https://github.com/ivannavatta',
    demo: null,
    year: 2025,
    featured: true,
  },
  {
    id: 'proyecto-2',
    title: { es: 'Proyecto de ejemplo 2', en: 'Sample project 2' },
    summary: {
      es: 'Script o herramienta de análisis de datos. Reemplazá este texto.',
      en: 'Data analysis script or tool. Replace this text.',
    },
    description: {
      es: 'Descripción detallada del proyecto: objetivos, desafíos técnicos y resultados.',
      en: 'Detailed project description: goals, technical challenges and results.',
    },
    highlights: {
      es: ['Procesamiento de datos', 'Reportes automáticos'],
      en: ['Data processing', 'Automated reports'],
    },
    tech: ['Python', 'NoSQL'],
    image: null,
    repo: 'https://github.com/ivannavatta',
    demo: null,
    year: 2024,
    featured: false,
  },
  {
    id: 'proyecto-3',
    title: { es: 'Proyecto de ejemplo 3', en: 'Sample project 3' },
    summary: {
      es: 'Sitio o landing page interactiva. Reemplazá este texto.',
      en: 'Interactive website or landing page. Replace this text.',
    },
    description: {
      es: 'Descripción detallada del proyecto: objetivos, desafíos técnicos y resultados.',
      en: 'Detailed project description: goals, technical challenges and results.',
    },
    highlights: {
      es: ['Diseño responsive', 'Animaciones'],
      en: ['Responsive design', 'Animations'],
    },
    tech: ['HTML', 'CSS', 'JavaScript'],
    image: null,
    repo: 'https://github.com/ivannavatta',
    demo: null,
    year: 2023,
    featured: false,
  },
]
