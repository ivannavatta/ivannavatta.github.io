import { AnimatePresence, motion } from 'motion/react'
import { FiAlertCircle, FiArrowRight, FiCheck } from 'react-icons/fi'
import { Button } from '@/shared/components'
import { profile } from '@/shared/data/profile'
import { useContactForm } from '../hooks/useContactForm'
import styles from '../Contact.module.css'

/** Campo con label flotante: el label sube cuando el input tiene foco o contenido. */
function Field({ id, label, error, errorText, multiline = false, ...props }) {
  const Input = multiline ? 'textarea' : 'input'
  return (
    <div className={`${styles.field} ${error ? styles.fieldError : ''}`}>
      <Input
        id={id}
        name={id}
        placeholder=" "
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <label htmlFor={id}>{label}</label>
      <AnimatePresence>
        {error && (
          <motion.span
            id={`${id}-error`}
            className={styles.errorText}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {errorText}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ContactForm({ t }) {
  const { values, errors, status, handleChange, handleBlur, handleSubmit } = useContactForm()
  const sending = status === 'sending'

  const feedback = {
    success: { icon: <FiCheck />, text: t.form.success, tone: styles.success },
    error: { icon: <FiAlertCircle />, text: t.form.error, tone: styles.failure, withEmail: true },
    'not-configured': {
      icon: <FiAlertCircle />,
      text: t.form.notConfigured,
      tone: styles.warning,
      withEmail: true,
    },
  }[status]

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <Field
          id="name"
          label={t.form.name}
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.name}
          errorText={t.errors[errors.name]}
          autoComplete="name"
        />
        <Field
          id="email"
          type="email"
          label={t.form.email}
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          errorText={t.errors[errors.email]}
          autoComplete="email"
        />
      </div>
      <Field
        id="message"
        multiline
        rows={4}
        label={t.form.message}
        value={values.message}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.message}
        errorText={t.errors[errors.message]}
      />

      {/* Honeypot anti-spam: invisible para personas */}
      <input
        type="text"
        name="website"
        value={values.website}
        onChange={handleChange}
        className={styles.honeypot}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className={styles.formFooter}>
        <Button
          type="submit"
          disabled={sending}
          icon={sending ? <span className={styles.spinner} /> : <FiArrowRight />}
        >
          {sending ? t.form.sending : t.form.submit}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {feedback && (
          <motion.p
            key={status}
            className={`${styles.feedback} ${feedback.tone}`}
            role="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {feedback.icon}
            <span>
              {feedback.text}
              {feedback.withEmail && (
                <>
                  {' '}
                  <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
                </>
              )}
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  )
}
