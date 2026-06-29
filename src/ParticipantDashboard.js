import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from './AppContext'
import { fetchParticipantCollections } from './lib/supabaseHelpers'
import Header from './Header'
import Footer from './Footer'
import SwipeableCard from './SwipeableCard'
import './pages.css'

export default function ParticipantDashboard() {
  const navigate = useNavigate()
  const { profile } = useApp()
  const [participantCollections, setParticipantCollections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile && profile.id) {
      setLoading(true)
      fetchParticipantCollections(profile.id)
        .then((data) => {
          const mapped = data.map((cp) => ({
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
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [profile])

  const pendingCollections = participantCollections.filter(c => c.pending > 0)
  const totalPending = pendingCollections.reduce((sum, c) => sum + c.pending, 0)

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

        <section className="collections-list">
          <h2 className="section-title">Pending</h2>
          <div className="list-count">{pendingCollections.length}</div>

          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : pendingCollections.length === 0 ? (
            <div className="empty-state">No pending collections</div>
          ) : (
            pendingCollections.map(collection => {
              const upiLink = collection.upiId
                ? `upi://pay?pa=${encodeURIComponent(collection.upiId)}&pn=${encodeURIComponent(collection.organiserName)}&am=${collection.amount}&cu=INR&tn=${encodeURIComponent(`Payment for ${collection.title}`)}`
                : null
              return (
              <SwipeableCard
                key={collection.id}
                id={collection.id}
                actions={
                  upiLink
                    ? [{ type: 'pay', handler: () => window.open(upiLink, '_blank', 'noopener') }, { type: 'view', handler: () => navigate(`/collection/${collection.id}`) }]
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
                  {upiLink ? (
                    <a
                      href={upiLink}
                      target="_blank"
                      rel="noopener"
                      className="upi-pay-btn"
                      onClick={e => e.stopPropagation()}
                      title={`Pay via UPI`}
                    >
                      Pay
                    </a>
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
    </main>
  )
}
