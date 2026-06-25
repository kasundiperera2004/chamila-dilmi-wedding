import { weddingData } from '../data/weddingData'

function Gallery() {
  return (
    <section className="section gallery-section" id="gallery">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">Gallery</p>
          <h2>Moments of love</h2>
        </div>
        <div className="gallery-grid">
          {weddingData.gallery.map((item) => (
            <figure className="gallery-item" key={item.title}>
              <img src={item.image} alt={item.title} />
              <figcaption>{item.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Gallery
