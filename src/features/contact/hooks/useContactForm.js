import { useCallback, useRef, useState } from 'react'
import { SEND_ERROR, SendError, isEmailConfigured, sendContactEmail } from '../services/emailService'

export const FIELDS = ['name', 'email', 'message']
export const MAX_LENGTH = { name: 80, email: 254, message: 2000 }

const EMPTY = { name: '', email: '', message: '', website: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Claves de error por campo (el texto lo pone el componente). */
function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = 'name'
  const email = values.email.trim()
  if (!email) errors.email = 'emailEmpty'
  else if (!EMAIL_RE.test(email)) errors.email = 'emailInvalid'
  if (values.message.trim().length < 10) errors.message = 'message'
  return errors
}

/**
 * Formulario de contacto.
 * - Valida al enviar; después del primer intento, los errores se actualizan mientras se escribe.
 * - Con errores, el foco va al primer campo inválido.
 * - status: idle | sending | success | failed | too-soon | not-configured
 *   Éxito: limpia el formulario. Error: conserva lo escrito.
 * - website es un honeypot: si viene completo, se finge el éxito sin enviar nada.
 */
export function useContactForm() {
  const [values, setValues] = useState(EMPTY)
  const [tried, setTried] = useState(false)
  const [status, setStatus] = useState('idle')
  const [sent, setSent] = useState(null) // nombre y email del último envío, para el mensaje de éxito
  const refs = useRef({})
  const sendingRef = useRef(false)

  const errors = tried ? validate(values) : {}

  const register = useCallback(
    (field) => (el) => {
      refs.current[field] = el
    },
    [],
  )

  const onChange = useCallback((event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setStatus((current) => (current === 'sending' ? current : 'idle'))
  }, [])

  const onSubmit = async (event) => {
    event.preventDefault()
    if (sendingRef.current) return
    setTried(true)
    const found = validate(values)
    const firstBad = FIELDS.find((field) => found[field])
    if (firstBad) {
      setStatus('idle')
      refs.current[firstBad]?.focus()
      return
    }

    const data = { name: values.name.trim(), email: values.email.trim(), message: values.message.trim() }
    if (values.website) {
      finish(data)
      return
    }
    if (!isEmailConfigured()) {
      setStatus(SEND_ERROR.notConfigured)
      return
    }

    sendingRef.current = true
    setStatus('sending')
    try {
      await sendContactEmail(data)
      finish(data)
    } catch (err) {
      setStatus(err instanceof SendError ? err.kind : SEND_ERROR.failed)
    } finally {
      sendingRef.current = false
    }
  }

  function finish(data) {
    setSent({ name: data.name.split(/\s+/)[0], email: data.email })
    setValues(EMPTY)
    setTried(false)
    setStatus('success')
  }

  return { values, errors, status, sent, register, onChange, onSubmit, configured: isEmailConfigured() }
}
