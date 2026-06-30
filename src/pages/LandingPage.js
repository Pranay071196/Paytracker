import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ThemeToggle from '../layout/ThemeToggle'
import '../styles/theme.css'
import './LandingPage.css'

export default function LandingPage() {
  const navigate = useNavigate()

  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      navigate('/select-role')
    } else {
      navigate('/login')
    }
  }

  return (
    <main className="page landing-page">
      <div className="topbar">
        <div className="brand">
          <span className="dot"></span>
          <span>PayCollect</span>
        </div>
        <div className="status">
          <span className="pulse"></span>
          All systems operational
        </div>
      </div>

      <div className="content">
        <div className="stats-card">
          <div className="stat">
            <span className="stat-label">Collected</span>
            <span className="stat-value">₹12.4K</span>
          </div>
          <div className="stat">
            <span className="stat-label">Pending</span>
            <span className="stat-value">₹2.8K</span>
          </div>
          <div className="stat">
            <span className="stat-label">Matched</span>
            <span className="stat-value">82%</span>
          </div>
        </div>

        <section className="section">
          <p className="eyebrow">Payment Collection Tracker</p>
          <h1>Collect & Reconcile with Ease</h1>
          <p>Create collections, invite participants via WhatsApp or SMS, auto-match PhonePe and Gmail receipts, and reconcile payments in one place.</p>
          <div className="actions">
            <button className="primary-btn" onClick={handleGetStarted}>
              Get Started →
            </button>
            <button className="secondary">Learn more</button>
          </div>
        </section>
      </div>

      <ThemeToggle />
    </main>
  )
}
