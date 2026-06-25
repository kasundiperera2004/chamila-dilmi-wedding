import { weddingData } from '../data/weddingData'

function Footer() {
  return (
    <footer className="footer-section" id="contact">
      <div className="section-inner footer-inner">
        <div>
          <p className="eyebrow">Contact</p>
          <h2>{weddingData.contact.name}</h2>
          <a href={weddingData.contact.phoneHref}>{weddingData.contact.phone}</a>
        </div>
        <p>{weddingData.couple} | {weddingData.date}</p>
      </div>
    </footer>
  )
}

export default Footer
