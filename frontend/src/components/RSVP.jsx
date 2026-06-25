import { useState } from 'react'

const initialForm = {
  name: '',
  phone: '',
  guests: '1',
  attending: 'yes',
  message: '',
}

function RSVP() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: 'loading', message: 'Sending your RSVP...' })

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error('Unable to send RSVP')
      }

      setForm(initialForm)
      setStatus({
        type: 'success',
        message: 'Thank you. Your RSVP has been received.',
      })
    } catch {
      setStatus({
        type: 'error',
        message: 'Please try again, or contact Ashan directly.',
      })
    }
  }

  return (
    <section className="section rsvp-section" id="rsvp">
      <div className="section-inner two-column">
        <div>
          <p className="eyebrow">RSVP</p>
          <h2>Will you celebrate with us?</h2>
          <p className="lead">
            Kindly let the family know if you can attend the wedding day.
          </p>
        </div>
        <form className="rsvp-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              name="name"
              onChange={handleChange}
              placeholder="Your name"
              required
              value={form.name}
            />
          </label>
          <label>
            Phone Number
            <input
              name="phone"
              onChange={handleChange}
              placeholder="07X XXX XXXX"
              required
              type="tel"
              value={form.phone}
            />
          </label>
          <div className="form-row">
            <label>
              Guests
              <input
                min="1"
                name="guests"
                onChange={handleChange}
                type="number"
                value={form.guests}
              />
            </label>
            <label>
              Attending
              <select name="attending" onChange={handleChange} value={form.attending}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="maybe">Maybe</option>
              </select>
            </label>
          </div>
          <label>
            Message
            <textarea
              name="message"
              onChange={handleChange}
              placeholder="Any message for the couple"
              rows="4"
              value={form.message}
            />
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
