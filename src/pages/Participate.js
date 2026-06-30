import { useNavigate } from 'react-router-dom'
import '../styles/theme.css'
import './Participate.css'

export default function Participate() {
  const navigate = useNavigate()

  return (
    <main className="page-screen">
      <div className="home-card">
        <h2>Participate in a collection</h2>
        <p>Join a collection and track your payments.</p>
        <div className="action-row">
          <button className="button" onClick={() => navigate('/login')}>
            Get started
          </button>
        </div>
      </div>
    </main>
  )
}
