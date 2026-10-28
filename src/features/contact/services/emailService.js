/**
 * Envío de mensajes con EmailJS (sin backend propio).
 * Las claves son públicas por diseño (van en el bundle) y se leen de VITE_EMAILJS_* (ver .env.example).
 * Sin claves, el formulario avisa y ofrece el email; no se hace ninguna llamada.
 * El SDK se carga recién al enviar (chunk aparte): no pesa en la carga de la página.
 *
 * Variables del template de EmailJS: {{from_name}}, {{from_email}}, {{reply_to}}, {{message}}
 */
const config = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
}

/** Un envío cada 10 s por navegador (lo controla el SDK con localStorage). */
const THROTTLE_MS = 10_000

export const SEND_ERROR = {
  notConfigured: 'not-configured',
  tooSoon: 'too-soon',
  failed: 'failed',
}

export class SendError extends Error {
  constructor(kind, cause) {
    super(`EmailJS: ${kind}`)
    this.name = 'SendError'
    this.kind = kind
    this.cause = cause
  }
}

export function isEmailConfigured() {
  return Boolean(config.serviceId && config.templateId && config.publicKey)
}

export async function sendContactEmail({ name, email, message }) {
  if (!isEmailConfigured()) throw new SendError(SEND_ERROR.notConfigured)
  try {
    const { default: emailjs } = await import('@emailjs/browser')
    return await emailjs.send(
      config.serviceId,
      config.templateId,
      { from_name: name, from_email: email, reply_to: email, message },
      {
        publicKey: config.publicKey,
        // Navegadores automatizados (navigator.webdriver) no envían: corta el spam más simple
        blockHeadless: true,
        limitRate: { id: 'portfolio-contacto', throttle: THROTTLE_MS },
      },
    )
  } catch (err) {
    throw new SendError(err?.status === 429 ? SEND_ERROR.tooSoon : SEND_ERROR.failed, err)
  }
}
