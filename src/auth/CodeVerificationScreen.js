import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SimpleHeader from '../layout/SimpleHeader'
import '../styles/theme.css'
import './CodeVerificationScreen.css'

export default function CodeVerificationScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  const [error, setError] = useState('')

  const handleResend = async () => {
    if (!email) return

    try {
      setError('')
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: process.env.REACT_APP_REDIRECT_URL,
          shouldCreateUser: true,
        },
      })
    } catch (err) {
      setError(err.message || 'Unable to resend the sign-in link.')
    }
  }

  return (
    <>
      <SimpleHeader />
      <main className="card-container">
        <article className="card">
          <section className="header">
            <button className="back-link" onClick={() => navigate('/login')}>
              ← Back
            </button>
            <p className="step">STEP 2 OF 2</p>
            <h1>Check your email</h1>
            <p className="description">We sent a secure sign-in link to {email || 'your email'}.</p>
          </section>

          <section className="header">
            <p className="note">Open the link in your inbox to continue.</p>
            {error ? <p className="note" style={{ color: '#b91c1c' }}>{error}</p> : null}
          </section>

          <footer className="footer">
            <button className="button" onClick={handleResend}>
              Resend link
            </button>
            <button className="continue-btn" onClick={() => navigate('/select-role')}>
              Continue
            </button>
          </footer>
        </article>
      </main>
    </>
  )
}
