export const about = {
  title: 'Negocio, datos y código.',
  statement: (year) =>
    `Estudio cómo la tecnología resuelve problemas de negocio, y programo desde ${year} para poder construir esas soluciones yo mismo.`,
  facts: {
    base: 'Base',
    education: 'Formación',
    educationValue: (university) => `${university}, Lic. en Gestión de TI`,
    since: 'Programo desde',
  },
  text: 'Combino programación, bases de datos, infraestructura tecnológica y gestión de proyectos. Me definen la responsabilidad, el pensamiento analítico y las ganas de aprender: en menos de un año pasé de mi primer curso de desarrollo web a programar un backend con Node.',
  principles: [
    {
      title: 'Primero, el problema.',
      text: 'Antes de escribir código modelo actores, datos y reglas. Lo practico con UML y análisis de sistemas en la facultad.',
    },
    {
      title: 'Piezas con una sola tarea.',
      text: 'Separo en capas y módulos: en MyTube, controladores, servicios y casos de uso; en Java, un TDA por estructura.',
    },
    {
      title: 'Aprender y explicar.',
      text: 'Aprendo rápido y en equipo, y explico las decisiones técnicas en términos que entiende cualquiera del negocio.',
    },
  ],
}
