export const skills = {
  title: 'Stack, por capas',
  lead: 'Cada bloque es una tecnología. Pasá el cursor o recorrelos con Tab para ver dónde la usé.',
  // Pantallas táctiles (sin cursor ni Tab a mano)
  leadTouch: 'Cada bloque es una tecnología. Tocá uno para ver dónde la usé.',
  detailTitle: 'Dónde la usé',
  detailHint: 'Elegí un bloque para ver en qué proyecto o curso usé esa tecnología.',
}

/**
 * Capas y tecnologías. `use`: lo que muestra el panel "Dónde la usé".
 * `sr`: la misma información, más corta, como parte del nombre accesible del botón
 * (el panel es visual: un lector de pantalla la escucha al enfocar cada tecnología).
 */
export const layers = [
  {
    name: 'Interfaz',
    tiles: [
      {
        name: 'HTML',
        use: 'Coderhouse, Desarrollo Web (2023), y la interfaz de MyTube.',
        sr: 'Coderhouse, Desarrollo Web (2023), y la interfaz de MyTube.',
      },
      {
        name: 'CSS',
        use: 'Coderhouse, Desarrollo Web (2023), y los estilos de MyTube junto a MUI y React-Bootstrap.',
        sr: 'Coderhouse, Desarrollo Web (2023), y los estilos de MyTube.',
      },
      {
        name: 'JavaScript',
        use: 'Coderhouse, curso de JavaScript (2023), y la base de todo el frontend de MyTube.',
        sr: 'Coderhouse, curso de JavaScript (2023), y el frontend de MyTube.',
      },
      {
        name: 'React',
        use: 'MyTube, con React 18 y TypeScript, y el curso React Js de Coderhouse, donde quedé en el Top 10.',
        sr: 'MyTube y el curso React Js de Coderhouse, Top 10 del curso.',
      },
      {
        name: 'TypeScript',
        use: 'MyTube, en el frontend y en el backend con Express.',
        sr: 'MyTube, frontend y backend.',
      },
    ],
  },
  {
    name: 'Backend',
    tiles: [
      {
        name: 'Java',
        use: 'Sistema de transporte, Programación II en UADE: TDA propios y excepciones.',
        sr: 'Sistema de transporte, Programación II en UADE.',
      },
      { name: 'Python', use: 'uadeHUB y box9, proyectos de UADE.', sr: 'uadeHUB y box9, proyectos de UADE.' },
      {
        name: 'Node.js y Express',
        use: 'Backend de MyTube y el curso Programación Backend de Coderhouse (2024, 94 horas).',
        sr: 'backend de MyTube y curso Programación Backend de Coderhouse.',
      },
    ],
  },
  {
    name: 'Datos',
    tiles: [
      { name: 'SQL', use: 'Bases de datos en la cursada de UADE.', sr: 'bases de datos en la cursada de UADE.' },
      {
        name: 'MongoDB',
        use: 'MyTube, con Mongoose, DAO y DTO, y el curso Programación Backend de Coderhouse.',
        sr: 'MyTube y curso Programación Backend de Coderhouse.',
      },
    ],
  },
  {
    name: 'Herramientas',
    tiles: [
      { name: 'Git', use: 'Todos los proyectos de esta página.', sr: 'todos los proyectos.' },
      {
        name: 'GitHub',
        use: 'Repositorios públicos de MyTube, uadeHUB y box9.',
        sr: 'repositorios de MyTube, uadeHUB y box9.',
      },
      { name: 'VS Code', use: 'Mi editor de todos los días.', sr: 'editor de todos los días.' },
      { name: 'Figma', use: 'Bocetos de interfaces antes de programarlas.', sr: 'bocetos de interfaces.' },
      { name: 'UML', use: 'Modelado de sistemas en la cursada de UADE.', sr: 'modelado de sistemas en UADE.' },
    ],
  },
  {
    name: 'Método',
    tiles: [
      { name: 'Scrum', use: 'Gestión de proyectos en la cursada de UADE.', sr: 'gestión de proyectos en UADE.' },
      {
        name: 'Análisis de sistemas',
        use: 'Relevamiento y modelado en la cursada de UADE.',
        sr: 'relevamiento y modelado en UADE.',
      },
    ],
  },
]
