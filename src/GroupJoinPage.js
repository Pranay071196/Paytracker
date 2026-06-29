import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from './AppContext'
import { fetchGroupByInviteCode, joinGroup, fetchGroupMembers } from './lib/supabaseGroupHelpers'
import SimpleHeader from './SimpleHeader'
import './pages.css'

export default function GroupJoinPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const { profile } = useApp()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)
  const [declined, setDeclined] = useState(false)

  useEffect(() => {
    if (inviteCode) {
      setLoading(true)
      fetchGroupByInviteCode(inviteCode)
        .then((data) => {
          if (!data) {
            setError('Invalid or expired invite link')
            return
          }
          setGroup(data)
          return fetchGroupMembers(data.id)
        })
        .then((membersData) => {
          if (membersData) setMembers(membersData)
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

  const handleDecline = () => {
    setDeclined(true)
  }

  if (loading) {
    return (
      <main className="page-landing">
        <SimpleHeader />
        <section className="panel" style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8' }}>Loading...</p>
        </section>
      </main>
    )
  }

  if (error && !group) {
    return (
      <main className="page-landing">
        <SimpleHeader />
        <section className="panel" style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
          <p style={{ color: '#b91c1c' }}>{error}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-landing">
      <SimpleHeader />
      <section className="panel" style={{ maxWidth: 400, margin: '60px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>👥</div>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem' }}>{group?.name}</h1>
          <p style={{ color: '#94a3b8', margin: '0 0 4px' }}>
            by {group?.organiser?.full_name || 'Unknown'}
          </p>
          {group?.whatsapp_group_name && (
            <p style={{ color: '#94a3b8', margin: '0', fontSize: '0.9rem' }}>
              📱 WhatsApp: {group.whatsapp_group_name}
            </p>
          )}
        </div>

        <h2 style={{ fontSize: '0.95rem', margin: '0 0 12px', fontWeight: 600 }}>
          Members ({members.length})
        </h2>

        {members.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>No members yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {members.map(member => (
              <div key={member.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 14,
                background: 'rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#1a5f4a', color: '#fff',
                  display: 'grid', placeItems: 'center',
                  fontWeight: 700, fontSize: '0.85rem',
                  flexShrink: 0,
                }}>
                  {member.name ? member.name[0].toUpperCase() : member.phone.slice(-2)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.name || 'Unknown'}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{member.phone}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {joined ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#059669', fontWeight: 600, marginBottom: 16 }}>You have joined this group! ✓</p>
            <button className="create-btn" onClick={() => navigate('/collections')}>
              Go to collections
            </button>
          </div>
        ) : declined ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#64748b', marginBottom: 16 }}>You declined the invitation</p>
            <button className="create-btn" onClick={() => navigate('/')}>
              Go home
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="create-btn" style={{ flex: 1 }} onClick={handleJoin} disabled={joining}>
              {joining ? 'Joining...' : 'Join group'}
            </button>
            <button
              className="create-btn"
              style={{ flex: 1, background: '#6b7280' }}
              onClick={handleDecline}
              disabled={joining}
            >
              Decline
            </button>
          </div>
        )}

        {error && <p style={{ color: '#b91c1c', marginTop: 12, fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
      </section>
    </main>
  )
}
