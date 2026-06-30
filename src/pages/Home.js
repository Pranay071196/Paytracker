import { useNavigate } from 'react-router-dom'
import '../styles/theme.css'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <main className="page-screen">
      <div className="home-card">
        <div className="options-grid">
          <div className="option-card" onClick={() => navigate('/organise')}>
            <span>👥</span>
            <span>I am organising a collection</span>
          </div>
          <div className="option-card" onClick={() => navigate('/participate')}>
            <span>👤</span>
            <span>I'm participating</span>
          </div>
        </div>
      </div>

      <div className="action-row">
        <button className="button primary" onClick={() => navigate('/login')}>
          Sign in
        </button>
        <button className="button secondary">
          Create account
        </button>
      </div>

      <div className="home-footer">
        PayCollect · Track payments seamlessly
      </div>
    </main>
  )
}
