import { useEffect, useMemo, useState } from 'react'
import { weddingData } from '../data/weddingData'

const getTimeLeft = (targetDate) => {
  const difference = new Date(targetDate).getTime() - Date.now()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

function Countdown() {
  const targetDate = useMemo(() => weddingData.dateTime, [])
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [targetDate])

  return (
    <section className="section countdown-section" id="countdown">
      <div className="section-inner centered">
        <p className="eyebrow">Counting Down</p>
        <h2>Until the celebration begins</h2>
        <div className="countdown-grid" aria-label="Countdown to wedding day">
          {Object.entries(timeLeft).map(([label, value]) => (
            <div className="countdown-item" key={label}>
              <strong>{String(value).padStart(2, '0')}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Countdown
