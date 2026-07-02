import { weddingData } from '../data/weddingData'

function Footer() {
  return (
    <footer className="footer-section" id="contact">
      <div className="section-inner footer-inner">
        <div className="footer-logo" aria-label={`${weddingData.couple} wedding logo`}>
          C<span>&</span>D
        </div>
        <p className="eyebrow">Thank You</p>
        <h2>With love, Chamila & Dilmi</h2>
        <p>
          Your presence will make our wedding day more beautiful and memorable.
          Thank you for sharing this special celebration with us.
        </p>
        <div className="gold-divider" aria-hidden="true" />
        <a className="contact-button" href={weddingData.contact.phoneHref}>
          Contact {weddingData.contact.name}
        </a>
        <small>
          <a className="footer-credit" href="https://blackskysquad.lk">
            © 2026 Black Sky Squad. All rights reserved.
          </a>
        </small>
      </div>
    </footer>
  )
}

export default Footer
