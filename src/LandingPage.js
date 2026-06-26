import { useNavigate } from 'react-router-dom'
import './pages.css'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="page landing-page">
      <div className="content">
        <header className="topbar">
          <div className="brand">
            <span className="dot"></span>
            <span>PayCollect</span>
          </div>
          <div className="status">
            <span className="pulse"></span>
            Live
          </div>
        </header>

        <section className="stats-card">
          <article className="stat">
            <div className="stat-label">Collected</div>
            <div className="stat-value">₹12.4K</div>
          </article>
          <article className="stat">
            <div className="stat-label">Pending</div>
            <div className="stat-value">₹5.9K</div>
          </article>
          <article className="stat">
            <div className="stat-label">Matched</div>
            <div className="stat-value">✔</div>
          </article>
        </section>

        <section className="section">
          <div className="eyebrow">Collection manager · India</div>
          <h1>Collect from the group. Reconcile with calm.</h1>
          <p>Built for organisers running matches, trips and events. Auto-match PhonePe payments. No more spreadsheets.</p>

          <div className="actions">
            <button 
              className="primary-btn" 
              onClick={() => navigate('/login')}
            >
              Get started →
            </button>
            <button 
              className="secondary" 
              onClick={() => navigate('/login')}
            >
              Already collecting? Sign in
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
