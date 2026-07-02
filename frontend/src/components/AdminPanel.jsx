import { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../lib/api'

const savedPasscodeKey = 'wedding-admin-passcode'

const formatDate = (dateValue) => {
  if (!dateValue) {
    return 'Not available'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function AdminPanel() {
  const [passcode, setPasscode] = useState(() => sessionStorage.getItem(savedPasscodeKey) || '')
  const [inputPasscode, setInputPasscode] = useState('')
  const [data, setData] = useState({ rsvps: [], totals: { guests: 0, yes: 0, no: 0, maybe: 0 } })
  const [deletingRowNumber, setDeletingRowNumber] = useState(null)
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  const hasAccess = Boolean(passcode)
  const totalResponses = data.rsvps.length
  const totalAttending = useMemo(
    () =>
      data.rsvps
        .filter((rsvp) => rsvp.attending === 'yes')
        .reduce((total, rsvp) => total + Number(rsvp.guests || 0), 0),
    [data.rsvps],
  )

  const loadRsvps = async (adminCode = passcode) => {
    if (!adminCode) {
      return
    }

    setStatus({ type: 'loading', message: 'Loading RSVPs...' })

    try {
      const response = await fetch(apiUrl('/api/rsvps'), {
        headers: {
          'x-admin-passcode': adminCode,
        },
      })

      if (!response.ok) {
        let message = response.status === 401 ? 'Invalid passcode.' : 'Unable to load RSVPs.'

        try {
          const result = await response.json()
          message = result.message || message
        } catch {
          message = response.statusText || message
        }

        throw new Error(message)
      }

      const result = await response.json()
      setData(result)
      setStatus({ type: 'success', message: 'RSVP list updated.' })
    } catch (error) {
      sessionStorage.removeItem(savedPasscodeKey)
      setPasscode('')
      setStatus({ type: 'error', message: error.message })
    }
  }

  useEffect(() => {
    loadRsvps()
  }, [])

  const handleLogin = (event) => {
    event.preventDefault()
    const nextPasscode = inputPasscode.trim()

    if (!nextPasscode) {
      setStatus({ type: 'error', message: 'Enter the admin passcode.' })
      return
    }

    sessionStorage.setItem(savedPasscodeKey, nextPasscode)
    setPasscode(nextPasscode)
    setInputPasscode('')
    loadRsvps(nextPasscode)
  }

  const handleLogout = () => {
    sessionStorage.removeItem(savedPasscodeKey)
    setPasscode('')
    setData({ rsvps: [], totals: { guests: 0, yes: 0, no: 0, maybe: 0 } })
  }

  const handleDelete = async (rsvp) => {
    if (!window.confirm(`Delete RSVP from ${rsvp.name}? This cannot be undone.`)) {
      return
    }

    setDeletingRowNumber(rsvp.rowNumber)
    setStatus({ type: 'loading', message: 'Deleting RSVP...' })

    try {
      const response = await fetch(apiUrl('/api/rsvps'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({ rowNumber: rsvp.rowNumber }),
      })

      if (!response.ok) {
        let message = response.status === 401 ? 'Invalid passcode.' : 'Unable to delete RSVP.'

        try {
          const result = await response.json()
          message = result.message || message
        } catch {
          message = response.statusText || message
        }

        throw new Error(message)
      }

      setStatus({ type: 'success', message: 'RSVP deleted.' })
      await loadRsvps()
    } catch (error) {
      if (error.message === 'Invalid admin passcode.' || error.message === 'Invalid passcode.') {
        sessionStorage.removeItem(savedPasscodeKey)
        setPasscode('')
      }

      setStatus({ type: 'error', message: error.message })
    } finally {
      setDeletingRowNumber(null)
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Admin Panel</p>
            <h1>Guest RSVPs</h1>
            <p>Review wedding attendance responses from Chamila and Dilmi's guests.</p>
          </div>
          <a className="admin-home-link" href="/">
            Back to invitation
          </a>
        </div>

        {!hasAccess ? (
          <form className="admin-login" onSubmit={handleLogin}>
            <label>
              Admin Passcode
              <input
                autoComplete="current-password"
                onChange={(event) => setInputPasscode(event.target.value)}
                placeholder="Enter passcode"
                type="password"
                value={inputPasscode}
              />
            </label>
            <button type="submit">Open Admin Panel</button>
          </form>
        ) : (
          <>
            <div className="admin-actions">
              <button onClick={() => loadRsvps()} type="button">
                Refresh RSVPs
              </button>
              <button className="secondary-button" onClick={handleLogout} type="button">
                Lock Panel
              </button>
            </div>

            <div className="admin-stats">
              <article>
                <span>Total Responses</span>
                <strong>{totalResponses}</strong>
              </article>
              <article>
                <span>Attending Guests</span>
                <strong>{totalAttending}</strong>
              </article>
              <article>
                <span>Yes</span>
                <strong>{data.totals.yes}</strong>
              </article>
              <article>
                <span>No / Maybe</span>
                <strong>{data.totals.no + data.totals.maybe}</strong>
              </article>
            </div>

            <div className="rsvp-table-wrap">
              {data.rsvps.length > 0 ? (
                <table className="rsvp-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Guests</th>
                      <th>Attending</th>
                      <th>Message</th>
                      <th>Submitted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rsvps.map((rsvp, index) => (
                      <tr key={`${rsvp.phone}-${rsvp.createdAt}-${index}`}>
                        <td data-label="Name">{rsvp.name}</td>
                        <td data-label="Phone">{rsvp.phone}</td>
                        <td data-label="Guests">{rsvp.guests}</td>
                        <td data-label="Attending">
                          <span className={`status-pill ${rsvp.attending}`}>{rsvp.attending}</span>
                        </td>
                        <td data-label="Message">{rsvp.message || '-'}</td>
                        <td data-label="Submitted">{formatDate(rsvp.createdAt)}</td>
                        <td data-label="Action">
                          <button
                            className="delete-rsvp-button"
                            disabled={deletingRowNumber === rsvp.rowNumber}
                            onClick={() => handleDelete(rsvp)}
                            type="button"
                          >
                            {deletingRowNumber === rsvp.rowNumber ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h2>No RSVPs yet</h2>
                  <p>Guest responses will appear here after they submit the RSVP form.</p>
                </div>
              )}
            </div>
          </>
        )}

        {status.message && (
          <p className={`form-status ${status.type}`} role="status">
            {status.message}
          </p>
        )}
      </section>
    </main>
  )
}

export default AdminPanel
