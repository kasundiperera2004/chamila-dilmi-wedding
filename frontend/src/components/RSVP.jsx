import { useState } from 'react'

const initialForm = {
  name: '',
  phone: '',
  guests: '1',
  attending: 'yes',
  message: '',
}

const normalizeSriLankanPhone = (value) => {
  const phone = String(value || '').trim().replace(/\s+/g, '')

  if (/^0\d{9}$/.test(phone)) {
    return phone
  }

  if (/^\+94\d{9}$/.test(phone)) {
    return `0${phone.slice(3)}`
  }

  if (/^94\d{9}$/.test(phone)) {
    return `0${phone.slice(2)}`
  }

  if (/^\d{9}$/.test(phone)) {
    return `0${phone}`
  }

  return ''
}

const validateForm = (form) => {
  const errors = {}
  const name = form.name.trim().replace(/\s+/g, ' ')
  const phone = normalizeSriLankanPhone(form.phone)
  const guests = Number(form.guests)

  if (name.length < 2) {
    errors.name = 'Please enter your full name.'
  } else if (name.length > 80) {
    errors.name = 'Name must be 80 characters or fewer.'
  }

  if (!phone) {
    errors.phone = 'Please enter a valid Sri Lankan phone number.'
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > 10) {
    errors.guests = 'Guest count must be between 1 and 10.'
  }

  if (!['yes', 'no'].includes(form.attending)) {
    errors.attending = 'Please select an attendance option.'
  }

  if (form.message.trim().length > 300) {
    errors.message = 'Message must be 300 characters or fewer.'
  }

  return errors
}

function RSVP() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'phone' ? value.slice(0, 16) : value
    setForm((current) => ({ ...current, [name]: nextValue }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleAttendanceChange = (attending) => {
    setForm((current) => ({ ...current, attending }))
    setErrors((current) => ({ ...current, attending: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateForm(form)
    const phone = normalizeSriLankanPhone(form.phone)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setStatus({
        type: 'error',
        message: 'Please fix the highlighted RSVP details.',
      })
      return
    }

    setStatus({ type: 'loading', message: 'Sending your RSVP...' })

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: form.name.trim().replace(/\s+/g, ' '),
          phone,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Unable to send RSVP')
      }

      setForm(initialForm)
      setErrors({})
      setStatus({
        type: 'success',
        message: 'Thank you. Your RSVP has been received.',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Please try again, or contact Ashan directly.',
      })
    }
  }

  return (
    <section className="section rsvp-section" id="rsvp">
      <span className="section-sparkle rsvp-sparkle" aria-hidden="true" />
      <div className="section-inner">
        <div className="section-heading centered">
          <p className="eyebrow">RSVP</p>
          <h2>Will you celebrate with us?</h2>
          <span className="thin-gold-divider" aria-hidden="true" />
          <p className="lead">
            Kindly let the family know if you can attend the wedding day.
          </p>
        </div>
        <form className="rsvp-form reveal-on-scroll" noValidate onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              aria-invalid={Boolean(errors.name)}
              autoComplete="name"
              maxLength="80"
              name="name"
              onChange={handleChange}
              placeholder="Your name"
              required
              value={form.name}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label>
            Phone Number
            <input
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              inputMode="tel"
              maxLength="16"
              name="phone"
              onChange={handleChange}
              placeholder="072 271 2127"
              required
              type="tel"
              value={form.phone}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </label>
          <div className="form-row">
            <label>
              Guests
              <input
                aria-invalid={Boolean(errors.guests)}
                min="1"
                max="10"
                name="guests"
                onChange={handleChange}
                type="number"
                value={form.guests}
              />
              {errors.guests && <span className="field-error">{errors.guests}</span>}
            </label>
            <label className="attendance-field">
              Will you attend?
              <div
                aria-invalid={Boolean(errors.attending)}
                aria-label="Will you attend?"
                className="attendance-options"
                role="radiogroup"
              >
                <button
                  aria-checked={form.attending === 'yes'}
                  className={form.attending === 'yes' ? 'is-selected' : ''}
                  onClick={() => handleAttendanceChange('yes')}
                  role="radio"
                  type="button"
                >
                  <span aria-hidden="true">✓</span>
                  Joyfully Accept
                </button>
                <button
                  aria-checked={form.attending === 'no'}
                  className={form.attending === 'no' ? 'is-selected' : ''}
                  onClick={() => handleAttendanceChange('no')}
                  role="radio"
                  type="button"
                >
                  <span aria-hidden="true">×</span>
                  Regretfully Decline
                </button>
              </div>
              {errors.attending && <span className="field-error">{errors.attending}</span>}
            </label>
          </div>
          <label>
            Message
            <textarea
              aria-invalid={Boolean(errors.message)}
              maxLength="300"
              name="message"
              onChange={handleChange}
              placeholder="Any message for the couple"
              rows="4"
              value={form.message}
            />
            <span className={errors.message ? 'field-error' : 'field-hint'}>
              {errors.message || `${form.message.length}/300 characters`}
            </span>
          </label>
          <button className="submit-rsvp-button" disabled={status.type === 'loading'} type="submit">
            {status.type === 'loading' ? 'Sending...' : 'Send RSVP'}
          </button>
          {status.message && (
            <p className={`form-status ${status.type}`} role="status">
              {status.message}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}

export default RSVP
