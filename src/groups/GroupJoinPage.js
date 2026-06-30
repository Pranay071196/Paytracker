import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import { fetchGroupByInviteCode, joinGroup, fetchGroupMembers } from '../lib/supabaseGroupHelpers'
import Footer from '../layout/Footer'
import './GroupJoinPage.css'

export default function GroupJoinPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const { profile } = useApp()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  const isOrganiser = profile && profile.id && group && group.organiser_id === profile.id

  useEffect(() => {
    if (inviteCode) {
      setLoading(true)
      fetchGroupByInviteCode(inviteCode)
        .then((data) => {
          if (!data) {
            setError('Group not found')
            return
          }
          setGroup(data)
          return fetchGroupMembers(data.id)
        })
        .then((membersData) => {
          if (membersData) setMembers(membersData)
        })
        .catch(() => setError('Invalid invite link'))
        .finally(() => setLoading(false))
    }
  }, [inviteCode])

  const handleJoin = async () => {
    if (!profile || !profile.id || !group) return
    setJoining(true)
    try {
      await joinGroup(group.invite_code, profile.id, profile.phone || '', profile.name || '')
      setJoined(true)
    } catch (err) {
      if (err.message && err.message.includes('already a member')) {
        setJoined(true)
      } else {
        setError(err.message || 'Failed to join group')
      }
    }
    setJoining(false)
  }

  const handleDecline = () => {
    navigate('/')
  }

  return (
    <main className="page-landing">
      {loading ? (
        <div className="empty-state">Loading invite...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : group ? (
        <section className="panel-groups" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>👥</div>
            <h1 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem' }}>{group.name}</h1>
            {group.whatsapp_group_name && (
              <p style={{ color: '#94a3b8', marginTop: 4 }}>
                📱 {group.whatsapp_group_name}
              </p>
            )}
          </div>

          <h2 className="section-title">Members ({members.length})</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {members.map(m => (
              <span key={m.id} className="group-mini-tag">{m.name || m.phone}</span>
            ))}
          </div>

          {joined || isOrganiser ? (
            <p style={{ textAlign: 'center', color: '#22c55e', fontWeight: 600, fontSize: '1rem' }}>
              {isOrganiser ? 'You are the organiser of this group' : 'You are a member of this group'}
            </p>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="create-btn"
                style={{ flex: 1 }}
                onClick={handleJoin}
                disabled={!profile || joining}
              >
                {joining ? 'Joining...' : !profile ? 'Sign in to join' : 'Accept'}
              </button>
              <button
                className="create-btn"
                style={{ flex: 1, background: '#6b7280' }}
                onClick={handleDecline}
              >
                Decline
              </button>
            </div>
          )}

          {error && !error.includes('already') && (
            <p style={{ color: '#b91c1c', textAlign: 'center', marginTop: 12 }}>{error}</p>
          )}
        </section>
      ) : null}
      <Footer />
    </main>
  )
}
