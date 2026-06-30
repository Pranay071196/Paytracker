import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import { fetchParticipantCollections } from '../lib/supabaseHelpers'
import { fetchGroupsForParticipant, joinGroup } from '../lib/supabaseGroupHelpers'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import SwipeableCard from '../common/SwipeableCard'
import '../styles/theme.css'
import './ParticipantDashboard.css'

export default function ParticipantDashboard() {
  const navigate = useNavigate()
  const { profile } = useApp()
  const [participantCollections, setParticipantCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [myGroups, setMyGroups] = useState([])
  const [inviteCode, setInviteCode] = useState('')
  const [joinMsg, setJoinMsg] = useState('')
  const [joiningGroup, setJoiningGroup] = useState(false)
  const [pickerCollection, setPickerCollection] = useState(null)

const upiApps = [
  { id: 'gpay', label: 'Google Pay', icon: '💳' },
  { id: 'phonepe', label: 'PhonePe', icon: '📱' },
  { id: 'paytm', label: 'Paytm', icon: '💰' },
  { id: 'other', label: 'Other UPI app', icon: '🏦' },
];

  useEffect(() => {
    if (profile && profile.id) {
      setLoading(true)
      Promise.all([
        fetchParticipantCollections(profile.id),
        fetchGroupsForParticipant(profile.id),
      ])
        .then(([collectionsData, groupsData]) => {
          const mapped = collectionsData.map((cp) => ({
            id: cp.collection.id,
            title: cp.collection.title,
            date: new Date(cp.collection.collection_date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
            }),
            category: cp.collection.category,
            amount: Number(cp.amount_due),
            participants: [cp.participant_phone],
            collected: Number(cp.amount_paid),
            paid: cp.status === 'paid' ? 1 : 0,
            pending: Number(cp.amount_due) - Number(cp.amount_paid),
            status: cp.status,
            upiId: cp.organiser_upi?.upi_id || null,
            organiserName: cp.organiser_upi?.full_name || 'Organiser',
          }))
          setParticipantCollections(mapped)
          setMyGroups(groupsData)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [profile])

  const pendingCollections = participantCollections.filter(c => c.pending > 0)
  const totalPending = pendingCollections.reduce((sum, c) => sum + c.pending, 0)

  const handleJoinGroup = async () => {
    if (!inviteCode.trim() || !profile?.id) return
    setJoiningGroup(true)
    setJoinMsg('')
    try {
      await joinGroup(inviteCode.trim(), profile.id, profile.phone || '', profile.full_name || '')
      setJoinMsg('Joined successfully!')
      setInviteCode('')
      const groupsData = await fetchGroupsForParticipant(profile.id)
      setMyGroups(groupsData)
    } catch (err) {
      setJoinMsg(err.message || 'Failed to join group')
    } finally {
      setJoiningGroup(false)
    }
  }

  return (
    <main className="page-participant">
      <Header />
      
      <section className="panel-participant">
        <div className="header-participant">
          <div>
            <p className="greeting-p">Namaste 👋</p>
            <h1 className="title-p">Your collections</h1>
          </div>
          <div className="avatar-p">P</div>
        </div>

        <div className="pending-card">
          <div className="pending-header">
            <span>Pending dues</span>
            <span className="badge-due">🔔 {pendingCollections.length} due</span>
          </div>
          <div className="pending-amount">₹{totalPending}</div>
          <div className="pending-status">{participantCollections.reduce((sum, c) => sum + c.paid, 0)} paid · {pendingCollections.length} pending</div>
        </div>

        <div className="groups-section">
          <h2 className="section-title">My Groups</h2>
          {myGroups.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 12 }}>Not in any group yet</p>
          ) : (
            <div className="groups-mini-list">
              {myGroups.map(m => (
                <div key={m.id} className="group-mini-tag">
                  <span>👥 {m.group?.name || 'Group'}</span>
                </div>
              ))}
            </div>
          )}

          <div className="join-group-row">
            <input
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
            />
            <button className="share-btn" onClick={handleJoinGroup} disabled={joiningGroup || !inviteCode.trim()}>
              {joiningGroup ? '...' : 'Join'}
            </button>
          </div>
          {joinMsg && <p style={{ fontSize: '0.82rem', marginTop: 6, color: joinMsg.includes('success') ? '#059669' : '#b91c1c' }}>{joinMsg}</p>}
        </div>

        <section className="collections-list">
          <h2 className="section-title">Pending</h2>
          <div className="list-count">{pendingCollections.length}</div>

          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : pendingCollections.length === 0 ? (
            <div className="empty-state">No pending collections</div>
          ) : (
            pendingCollections.map(collection => {
              const hasUpi = collection.upiId
              return (
              <SwipeableCard
                key={collection.id}
                id={collection.id}
                actions={
                  hasUpi
                    ? [{ type: 'pay', handler: () => setPickerCollection(collection) }, { type: 'view', handler: () => navigate(`/collection/${collection.id}`) }]
                    : [{ type: 'view', handler: () => navigate(`/collection/${collection.id}`) }]
                }
              >
                <div className="collection-item">
                  <div className="item-icon">⚽</div>
                  <div className="item-details">
                    <div className="item-title">{collection.title}</div>
                    <div className="item-date">{collection.date}</div>
                    <div className="item-meta">Due soon</div>
                  </div>
                  <div className="item-amount">₹{collection.amount}</div>
                  {hasUpi ? (
                    <button
                      className="upi-pay-btn"
                      onClick={e => {
                        e.stopPropagation()
                        setPickerCollection(collection)
                      }}
                    >
                      Pay
                    </button>
                  ) : (
                    <div className="item-status pending-badge">{collection.status === 'paid' ? 'Paid' : 'Pending'}</div>
                  )}
                </div>
              </SwipeableCard>
            )})
          )}
        </section>
      </section>

      <Footer />

      {pickerCollection && (
        <div className="modal-screen" onClick={() => setPickerCollection(null)}>
          <div className="modal-card upi-picker" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h1>Pay via</h1>
              <button className="close-btn" onClick={() => setPickerCollection(null)}>✕</button>
            </div>
            <div className="modal-content upi-picker-content">
              <p className="picker-subtitle">Pay ₹{pickerCollection.amount} for {pickerCollection.title}</p>
              {upiApps.map(app => (
                <button
                  key={app.id}
                  className={`upi-app-btn ${app.id === 'other' ? 'other' : ''}`}
                  onClick={() => {
                    const c = pickerCollection
                    //const url = `upi://pay?pa=${c.upiId}&pn=${encodeURIComponent(c.organiserName)}&am=${Number(c.amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Payment for ${c.title}`)}&tr=${Date.now()}`
                    const url = `upi://pay?pa=${c.upiId}&pn=${encodeURIComponent(c.organiserName)}&am=${Number(c.amount).toFixed(2)}&cu=INR`
                    setPickerCollection(null)
                    window.location.href = url
                  }}
                >
                  <span className="upi-app-icon">{app.icon}</span>
                  <span className="upi-app-label">{app.label}</span>
                  <span className="upi-app-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
