import { useNavigate } from 'react-router-dom'
import SimpleHeader from './SimpleHeader'
import './pages.css'

export default function LoginScreen() {
  const navigate = useNavigate()

  return (
    <>
      <SimpleHeader />
      <main className="screen">
        <article className="card">
        <section className="card-header">
          <p className="step">STEP 1 OF 2</p>
          <h1>Enter your phone</h1>
          <p className="description">We'll text you a verification code. PhonePe number works best for auto-reconciliation.</p>
        </section>

        <section className="input-panel">
          <label className="label" htmlFor="phone">Phone number</label>
          <div className="field-group">
            <div className="input-row">
              <div className="country">
                <span className="flag">🇮🇳</span>
                +91
              </div>
              <input className="input" id="phone" type="tel" placeholder="98765 43210" />
            </div>
          </div>
          <p className="note">End-to-end encrypted. We never share your number.</p>
        </section>

        <footer className="footer">
          <button 
            className="button"
            onClick={() => navigate('/verify-code')}
          >
            Send OTP
          </button>
        </footer>
      </article>
    </main>
    </>
  )
}
