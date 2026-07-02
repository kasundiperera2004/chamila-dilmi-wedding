import AdminPanel from './components/AdminPanel'
import Countdown from './components/Countdown'
import Events from './components/Events'
import Footer from './components/Footer'
import Hero from './components/Hero'
import RSVP from './components/RSVP'

function App() {
  const isAdminRoute =
    window.location.pathname === '/admin' ||
    window.location.hash === '#/admin' ||
    window.location.hash === '#rsvp/admin'

  if (isAdminRoute) {
    return <AdminPanel />
  }

  return (
    <main className="site-frame">
      <div className="invitation-shell">
        <div className="ambient-particles" aria-hidden="true">
          {Array.from({ length: 22 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <span className="floral-corner floral-corner-top-left" aria-hidden="true" />
        <span className="floral-corner floral-corner-top-right" aria-hidden="true" />
        <span className="floral-corner floral-corner-bottom-left" aria-hidden="true" />
        <span className="floral-corner floral-corner-bottom-right" aria-hidden="true" />
        <Hero />
        <Countdown />
        <Events />
        <RSVP />
        <Footer />
      </div>
    </main>
  )
}

export default App
