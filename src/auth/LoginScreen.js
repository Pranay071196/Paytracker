import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useApp } from '../AppContext'
import SimpleHeader from '../layout/SimpleHeader'
import '../styles/theme.css'
import './LoginScreen.css'

export function normalizeEmail(email) {
  return `${email || ''}`.trim().toLowerCase()
}

export function normalizePhoneNumber(phone) {
  const digits = `${phone || ''}`.replace(/\D/g, '')

  if (!digits) return ''
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  if (digits.startsWith('0') && digits.length > 10) return `+${digits.slice(1)}`

  return digits.startsWith('+') ? `+${digits.slice(1)}` : `+${digits}`
}

export default function LoginScreen({ session }) {
  const navigate = useNavigate()
  const { updateUser } = useApp()

  useEffect(() => {
    if (session) {
      navigate('/select-role', { replace: true })
    }
  }, [session, navigate])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSendOtp = async () => {
    const normalizedEmail = normalizeEmail(email)
    const normalizedPhone = normalizePhoneNumber(phone)

    if (!normalizedEmail) {
      setError('Please enter a valid email address.')
      return
    }

    if (!normalizedPhone) {
      setError('Please enter a valid phone number.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setMessage('')

      console.log('[Login] Sending OTP to:', normalizedEmail)
      const redirectUrl = new URL(process.env.REACT_APP_REDIRECT_URL || window.location.origin + '/login')
      if (normalizedPhone) redirectUrl.searchParams.set('phone', normalizedPhone)
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectUrl.toString(),
          shouldCreateUser: true,
          data: { phone: normalizedPhone },
        },
      })

      if (error) throw error
      console.log('[Login] OTP sent')

      localStorage.setItem('pendingPhone', normalizedPhone)
      updateUser({ email: normalizedEmail, phone: normalizedPhone })
      setMessage('Magic link sent. Please check your email.')
      navigate('/verify-code', { state: { email: normalizedEmail, phone: normalizedPhone } })
    } catch (err) {
      setError(err.message || 'Unable to send the sign-in link right now.')
    } finally {
      setLoading(false)
    }
  }

  const handleDevSkip = async () => {
    const normalizedEmail = normalizeEmail(email) || `dev-${Date.now()}@example.com`
    const normalizedPhone = normalizePhoneNumber(phone) || `+919999999999`

    localStorage.setItem('pendingPhone', normalizedPhone)
    updateUser({ email: normalizedEmail, phone: normalizedPhone })

    console.log('[Login] Dev skip:', normalizedEmail, normalizedPhone)
    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: 'dev-password-123',
      })

      if (error && !error.message?.includes('User already registered')) {
        console.warn('[Login] Signup error:', error.message)
      } else {
        console.log('[Login] Signup ok')
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: 'dev-password-123',
      })

      if (signInError) {
        console.warn('[Login] Sign-in error:', signInError.message)
      } else {
        console.log('[Login] Signed in, session:', !!data?.session)
      }

      navigate('/select-role')
    } catch (err) {
      console.warn('[Login] Dev skip exception:', err)
      navigate('/select-role')
    }
  }

  return (
    <>
      <SimpleHeader />
      <main className="screen">
        <article className="card">
          <section className="card-header">
            <p className="step">STEP 1 OF 2</p>
            <h1>Enter your details</h1>
            <p className="description">We'll send you a secure sign-in link to your email and keep your phone number on file.</p>
          </section>

          <section className="input-panel">
            <label className="label" htmlFor="email">Email address</label>
            <input
              className="input"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <label className="label" htmlFor="phone">Phone number</label>
            <div className="field-group">
              <div className="input-row">
                <div className="country">
                  <span className="flag">🇮🇳</span>
                  +91
                </div>
                <input
                  className="input"
                  id="phone"
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </div>
            {error ? <p className="note" style={{ color: '#b91c1c' }}>{error}</p> : null}
            {message ? <p className="note">{message}</p> : null}
            <p className="note">We use your email for sign-in and your phone number for account contact.</p>
          </section>

          <footer className="footer">
            <button className="button" onClick={handleSendOtp} disabled={loading}>
              {loading ? 'Sending...' : 'Send sign-in link'}
            </button>
            {process.env.NODE_ENV !== 'production' ? (
              <button className="button" onClick={handleDevSkip} style={{ marginTop: 8 }}>
                Dev mode: skip to role
              </button>
            ) : null}
          </footer>
        </article>
      </main>
    </>
  )
}
