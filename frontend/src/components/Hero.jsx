import heroImage from '../assets/hero.png'
import { weddingData } from '../data/weddingData'

function Hero() {
  return (
    <section className="hero-section" id="home">
      <div className="hero-content">
        <p className="eyebrow">Wedding Invitation</p>
        <h1>{weddingData.couple}</h1>
        <p className="hero-copy">{weddingData.invitation}</p>
        <div className="hero-details" aria-label="Wedding date and venue">
          <span>{weddingData.date}</span>
          <span>{weddingData.venue.address}</span>
        </div>
        <a className="primary-link" href="#rsvp">
          RSVP Now
        </a>
      </div>
      <figure className="couple-portrait">
        <img className="hero-image" src={heroImage} alt="Chamila and Dilmi" />
      </figure>
    </section>
  )
}

export default Hero
