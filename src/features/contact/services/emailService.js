import emailjs from '@emailjs/browser'

/**
 * Envío de emails con EmailJS (sin backend).
 * Las claves se leen de las variables de entorno (ver .env.example).
 *
 * Variables que usa el template de EmailJS:
 *   {{from_name}}, {{from_email}}, {{reply_to}}, {{message}}
 */
const config = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super('EmailJS no está configurado: completá las variables VITE_EMAILJS_* en .env')
    this.name = 'EmailNotConfiguredError'
  }
}

export function isEmailConfigured() {
  return Boolean(config.serviceId && config.templateId && config.publicKey)
}

export async function sendContactEmail({ name, email, message }) {
  if (!isEmailConfigured()) throw new EmailNotConfiguredError()

  return emailjs.send(
    config.serviceId,
    config.templateId,
    {
      from_name: name,
      from_email: email,
      reply_to: email,
      message,
    },
    { publicKey: config.publicKey },
  )
}
