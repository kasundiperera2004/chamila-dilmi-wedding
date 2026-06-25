import { weddingData } from '../data/weddingData'

function Events() {
  return (
    <section className="section events-section" id="venue">
      <div className="section-inner two-column">
        <div>
          <p className="eyebrow">Venue</p>
          <h2>{weddingData.venue.name}</h2>
          <p className="lead">{weddingData.venue.location}</p>
          <p>
            Join Chamila and Dilmi for a joyful wedding celebration surrounded by
            family, friends, blessings, and love.
          </p>
        </div>
        <div className="schedule-panel" id="schedule">
          <p className="eyebrow">Wedding Day Schedule</p>
          {weddingData.schedule.map((event) => (
            <article className="schedule-item" key={`${event.time}-${event.title}`}>
              <time>{event.time}</time>
              <div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Events
