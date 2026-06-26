import { useLocation, Link } from 'react-router-dom'

export default function Participate() {
  const location = useLocation()
  const option = location.state?.option?.label || 'your chosen activity'

  return (
    <div className="page-screen container">
      <div className="home-card">
        <h1>Participate in {option}</h1>
        <p>Use this page to join and participate in the selected activity.</p>
        <div className="action-row">
          <Link className="button" to="/home">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
