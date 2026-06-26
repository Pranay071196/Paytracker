import { useNavigate } from 'react-router-dom'
import './pages.css'

export default function CodeVerificationScreen() {
  const navigate = useNavigate()

  return (
    <main className="card-container">
      <main className="card">
        <section className="header">
          <button 
            className="back-link"
            onClick={() => navigate('/login')}
          >
            ← Back
          </button>
          <p className="step">STEP 2 OF 2</p>
          <h1>Enter the code</h1>
          <p className="description">Sent to +917019755101. Hint: any 6-digit code works (try 123456)</p>
        </section>

        <section className="header">
          <div className="pin-row">
            <div className="pin-cell">1</div>
            <div className="pin-cell">2</div>
            <div className="pin-cell">3</div>
            <div className="pin-cell">4</div>
            <div className="pin-cell">5</div>
            <div className="pin-cell">6</div>
          </div>
        </section>

        <footer className="footer">
          <p className="help">Didn't get it? Resend in 27s</p>
          <button 
            className="continue-btn"
            onClick={() => navigate('/select-role')}
          >
            Verify
          </button>
        </footer>
      </main>
    </main>
  )
}
