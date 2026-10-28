export const contact = {
  title: 'Contacto',
  lead: 'Busco una pasantía o mi primer puesto como desarrollador.',
  text: 'Si tu equipo construye software para resolver problemas de negocio, quiero conocerlo. También me sumo a proyectos puntuales.',
  channels: 'Canales',
  newTab: '(se abre en otra pestaña)',
  write: 'Escribir un mensaje',
  hideForm: 'Ocultar el formulario',
  footer: (year) => `Ivan Navatta · Buenos Aires · ${year}`,
  backToTop: 'Volver al inicio',
}

export const channels = {
  email: { label: 'Email' },
  linkedin: { label: 'LinkedIn' },
  github: { label: 'GitHub' },
  cv: { label: 'CV', value: 'Descargar PDF' },
}

export const copyEmail = {
  idle: 'Copiar email',
  done: 'Copiado',
  failed: 'No se pudo copiar',
  announceDone: 'Email copiado al portapapeles.',
  announceFailed: (email) => `No se pudo copiar. El email es ${email}.`,
}

export const form = {
  title: 'O dejame un mensaje',
  name: 'Nombre',
  email: 'Email',
  message: 'Mensaje',
  honeypot: 'No completes este campo',
  submit: 'Enviar mensaje',
  sending: 'Enviando…',
  errors: {
    name: 'Escribí tu nombre.',
    emailEmpty: 'Escribí tu email para que pueda responderte.',
    emailInvalid: 'Revisá el email: tiene que tener @ y un dominio, como nombre@empresa.com.',
    message: 'Contame en qué te puedo ayudar (al menos 10 caracteres).',
  },
  success: (name, email) => `Mensaje enviado. Gracias, ${name}: te respondo a ${email}.`,
  error: 'No se pudo enviar el mensaje. Lo que escribiste sigue acá: probá de nuevo en un rato o escribime a',
  tooSoon: 'Acabás de mandar un mensaje. Esperá unos segundos para mandar otro, o escribime a',
  notConfigured: 'El envío desde acá todavía no está activo. Escribime a',
  notConfiguredOpen: 'El envío desde acá todavía no está activo.',
  openInMail: 'Abrir el mensaje en tu correo',
  mailSubject: (name) => `Contacto desde el portfolio: ${name}`,
}
