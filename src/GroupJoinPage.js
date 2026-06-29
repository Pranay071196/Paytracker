import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from './AppContext'
import { fetchGroupByInviteCode, joinGroup } from './lib/supabaseGroupHelpers'
import SimpleHeader from './SimpleHeader'
import './pages.css'

export default function GroupJoinPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const { profile } = useApp()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (inviteCode) {
      setLoading(true)
      fetchGroupByInviteCode(inviteCode)
        .then((data) => {
          if (!data) setError('Invalid or expired invite link')
          else setGroup(data)
        })
        .catch(() => setError('Failed to load group'))
        .finally(() => setLoading(false))
    }
  }, [inviteCode])

  const handleJoin = async () => {
    if (!profile?.id) {
      navigate('/login')
      return
    }

    setJoining(true)
    setError('')
    try {
      await joinGroup(inviteCode, profile.id, profile.phone || '', profile.full_name || '')
      setJoined(true)
    } catch (err) {
      setError(err.message || 'Failed to join group')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="app-wrapper theme-dark">
        <div className="screen">
          <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !group) {
    return (
      <div className="app-wrapper theme-dark">
        <div className="screen">
          <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ color: '#b91c1c' }}>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="page-landing">
      <SimpleHeader />
      <section className="panel" style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>👥</div>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', color: '#f8fafc' }}>{group?.name}</h1>
        <p style={{ color: '#94a3b8', margin: '0 0 4px' }}>
          by {group?.organiser?.full_name || 'Unknown'}
        </p>
        {group?.whatsapp_group_name && (
          <p style={{ color: '#94a3b8', margin: '0 0 24px', fontSize: '0.9rem' }}>
            📱 WhatsApp: {group.whatsapp_group_name}
          </p>
        )}

        {joined ? (
          <div>
            <p style={{ color: '#059669', fontWeight: 600, marginBottom: 16 }}>You have joined this group! ✓</p>
            <button className="create-btn" onClick={() => navigate('/participant-dashboard')}>
              Go to dashboard
            </button>
          </div>
        ) : (
          <button className="create-btn" onClick={handleJoin} disabled={joining}>
            {joining ? 'Joining...' : 'Join group'}
          </button>
        )}

        {error && <p style={{ color: '#b91c1c', marginTop: 12, fontSize: '0.9rem' }}>{error}</p>}
      </section>
    </main>
  )
}
