import { weddingData } from '../data/weddingData'

function Events() {
  return (
    <section className="section events-section" id="venue">
      <span className="ornament-vine events-vine" aria-hidden="true" />
      <div className="section-inner">
        <div className="section-heading centered">
          <p className="eyebrow">Venue</p>
          <h2>{weddingData.venue.name}</h2>
          <span className="thin-gold-divider" aria-hidden="true" />
          <p className="lead">{weddingData.venue.location}</p>
          <p>
            Join Chamila and Dilmi for a joyful wedding celebration surrounded by
            family, friends, blessings, and love.
          </p>
          <a
            className="map-link"
            href={weddingData.venue.directionsUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open Google Maps
          </a>
        </div>
        <div className="map-panel" aria-label="Google Map location for Hotel Shans, Galigamuwa">
          <iframe
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={weddingData.venue.mapUrl}
            title="Hotel Shans, Galigamuwa map"
          />
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
