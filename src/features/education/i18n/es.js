export const education = {
  title: 'Recorrido',
  lead: 'Cuatro cursos intensivos de programación en Coderhouse y, desde 2025, la licenciatura en Gestión de la Tecnología de la Información en UADE. Cada bloque equivale a unas diez horas de cursada.',
  showCert: 'Ver certificado',
  hours: (h) => `${h} h`,
  certAlt: (title) => `Certificado de Coderhouse del curso ${title}, a nombre de Ivan Navatta`,
  certCaption: (title) => `Certificado · ${title} · Coderhouse`,
}

/** Texto de cada paso; las horas y la imagen salen de @/shared/data/certifications. */
export const steps = {
  web: { when: 'Jun. 2023', what: 'Desarrollo Web', where: 'Coderhouse' },
  javascript: { when: 'Ago. 2023', what: 'JavaScript', where: 'Coderhouse' },
  react: { when: 'Oct. 2023', what: 'React Js', where: 'Coderhouse · Top 10 del curso' },
  backend: { when: 'May. 2024', what: 'Programación Backend', where: 'Coderhouse' },
  uade: {
    when: 'Mar. 2025 – hoy',
    what: 'Lic. en Gestión de TI',
    where: 'UADE · Licenciatura en Gestión de la Tecnología de la Información',
  },
}
