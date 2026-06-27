import { useState } from 'react'

const initialForm = {
  name: '',
  phone: '',
  guests: '1',
  attending: 'yes',
  message: '',
}

const validateForm = (form) => {
  const errors = {}
  const name = form.name.trim().replace(/\s+/g, ' ')
  const phone = form.phone.trim()
  const normalizedPhone = phone.replace(/\s/g, '')
  const guests = Number(form.guests)

  if (name.length < 2) {
    errors.name = 'Please enter your full name.'
  } else if (name.length > 80) {
    errors.name = 'Name must be 80 characters or fewer.'
  }

  if (!/^0\d{9}$/.test(normalizedPhone)) {
    errors.phone = 'Use a valid number like 0782984305.'
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > 10) {
    errors.guests = 'Guest count must be between 1 and 10.'
  }

  if (!['yes', 'no', 'maybe'].includes(form.attending)) {
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
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateForm(form)

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
          phone: form.phone.trim().replace(/\s/g, ''),
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
      <div className="section-inner">
        <div className="section-heading centered">
          <p className="eyebrow">RSVP</p>
          <h2>Will you celebrate with us?</h2>
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
              maxLength="12"
              name="phone"
              onChange={handleChange}
              placeholder="07X XXX XXXX"
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
            <label>
              Attending
              <select
                aria-invalid={Boolean(errors.attending)}
                name="attending"
                onChange={handleChange}
                value={form.attending}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="maybe">Maybe</option>
              </select>
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
          <button disabled={status.type === 'loading'} type="submit">
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
