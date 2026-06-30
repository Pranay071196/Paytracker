import { useNavigate } from 'react-router-dom'
import '../styles/theme.css'
import './Organize.css'

export default function Organize() {
  const navigate = useNavigate()

  return (
    <main className="page-screen">
      <div className="home-card">
        <h2>Organise a collection</h2>
        <p>Create a new collection, add participants, and track payments.</p>
        <div className="action-row">
          <button className="button" onClick={() => navigate('/login')}>
            Get started
          </button>
        </div>
      </div>
    </main>
  )
}
