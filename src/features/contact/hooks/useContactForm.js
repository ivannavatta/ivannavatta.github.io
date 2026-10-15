import { useState } from 'react'
import { EmailNotConfiguredError, sendContactEmail } from '../services/emailService'

const INITIAL_VALUES = { name: '', email: '', message: '', website: '' }
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Devuelve las claves de error por campo (se traducen en el componente). */
function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'required'
  if (!values.email.trim()) errors.email = 'required'
  else if (!EMAIL_REGEX.test(values.email.trim())) errors.email = 'email'
  if (!values.message.trim()) errors.message = 'required'
  else if (values.message.trim().length < 10) errors.message = 'messageShort'
  return errors
}

/** status: 'idle' | 'sending' | 'success' | 'error' | 'not-configured' */
export function useContactForm() {
  const [values, setValues] = useState(INITIAL_VALUES)
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle')

  const errors = validate(values)
  const visibleErrors = Object.fromEntries(Object.entries(errors).filter(([field]) => touched[field]))

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    if (status !== 'sending' && status !== 'idle') setStatus('idle')
  }

  const handleBlur = (event) => {
    setTouched((current) => ({ ...current, [event.target.name]: true }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ name: true, email: true, message: true })
    if (Object.keys(errors).length > 0 || status === 'sending') return

    // Honeypot: los bots completan el campo oculto "website"
    if (values.website) {
      setStatus('success')
      return
    }

    setStatus('sending')
    try {
      await sendContactEmail({
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
      })
      setStatus('success')
      setValues(INITIAL_VALUES)
      setTouched({})
    } catch (error) {
      setStatus(error instanceof EmailNotConfiguredError ? 'not-configured' : 'error')
    }
  }

  return { values, errors: visibleErrors, status, handleChange, handleBlur, handleSubmit }
}
