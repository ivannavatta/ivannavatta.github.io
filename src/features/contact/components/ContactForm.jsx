import { Button } from '@/shared/components/Button/Button'
import { EMAIL } from '../data/channels'
import { MAX_LENGTH, useContactForm } from '../hooks/useContactForm'
import { copy } from '../i18n'
import styles from './Contact.module.css'

const t = copy.form

function Field({ id, name, label, error, register, wide = false, multiline = false, ...props }) {
  const Control = multiline ? 'textarea' : 'input'
  const errorId = `${id}-error`
  return (
    <div className={wide ? `${styles.field} ${styles.fieldWide}` : styles.field}>
      <label htmlFor={id}>{label}</label>
      <Control
        ref={register(name)}
        id={id}
        name={name}
        maxLength={MAX_LENGTH[name]}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
        data-lenis-prevent={multiline || undefined}
        {...props}
      />
      <p className={styles.error} id={errorId}>
        {error ? t.errors[error] : ''}
      </p>
    </div>
  )
}

function mailtoWith(values) {
  const subject = encodeURIComponent(t.mailSubject(values.name.trim()))
  const body = encodeURIComponent(values.message.trim())
  return `mailto:${EMAIL}?subject=${subject}&body=${body}`
}

/**
 * Formulario compacto: nombre y email en una fila, mensaje de tres líneas.
 * Envío con EmailJS; sin claves avisa desde el principio y ofrece abrir el mensaje en el correo.
 */
export function ContactForm({ id, formRef, hidden }) {
  const { values, errors, status, sent, register, onChange, onSubmit, configured } = useContactForm()
  const sending = status === 'sending'
  const mailLink = (
    <a className={styles.inlineLink} href={`mailto:${EMAIL}`}>
      {EMAIL}
    </a>
  )

  let message = null
  let tone = ''
  if (status === 'success' && sent) {
    message = t.success(sent.name, sent.email)
    tone = styles.ok
  } else if (status === 'failed' || status === 'too-soon') {
    message = (
      <>
        {status === 'failed' ? t.error : t.tooSoon} {mailLink}.
      </>
    )
    tone = styles.bad
  } else if (status === 'not-configured') {
    message = (
      <>
        {t.notConfiguredOpen}{' '}
        <a className={styles.inlineLink} href={mailtoWith(values)}>
          {t.openInMail}
        </a>
        .
      </>
    )
  }

  return (
    <form
      ref={formRef}
      className={styles.form}
      id={id}
      hidden={hidden}
      noValidate
      aria-labelledby={`${id}-title`}
      onSubmit={onSubmit}
    >
      <h3 className={styles.formTitle} id={`${id}-title`}>
        {t.title}
      </h3>
      {!configured && (
        <p className={styles.formNote}>
          {t.notConfigured} {mailLink}.
        </p>
      )}
      <Field
        id={`${id}-name`}
        name="name"
        label={t.name}
        type="text"
        autoComplete="name"
        required
        value={values.name}
        onChange={onChange}
        error={errors.name}
        register={register}
      />
      <Field
        id={`${id}-email`}
        name="email"
        label={t.email}
        type="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        required
        value={values.email}
        onChange={onChange}
        error={errors.email}
        register={register}
      />
      <Field
        id={`${id}-message`}
        name="message"
        label={t.message}
        multiline
        wide
        rows={3}
        required
        value={values.message}
        onChange={onChange}
        error={errors.message}
        register={register}
      />

      {/* Honeypot: fuera de pantalla y fuera del orden de Tab. Las personas no lo ven ni lo llenan. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${id}-website`}>{t.honeypot}</label>
        <input
          id={`${id}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          maxLength={200}
          value={values.website}
          onChange={onChange}
        />
      </div>

      <div className={styles.formEnd}>
        <Button
          type="submit"
          className={styles.send}
          aria-disabled={sending || undefined}
          aria-busy={sending || undefined}
        >
          {sending ? t.sending : t.submit}
        </Button>
        <p className={tone ? `${styles.status} ${tone}` : styles.status} role="status">
          {message}
        </p>
      </div>
    </form>
  )
}
