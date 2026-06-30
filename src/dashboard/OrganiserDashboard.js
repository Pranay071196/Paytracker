import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import SwipeableCard from '../common/SwipeableCard'
import '../styles/theme.css'
import './OrganiserDashboard.css'

export default function OrganiserDashboard() {
  const navigate = useNavigate()
  const { collections, refreshCollections, deleteCollection, profile } = useApp()

  useEffect(() => {
    refreshCollections()
  }, [refreshCollections])

  const totalCollected = collections.reduce((sum, c) => sum + c.collected, 0)
  const totalPending = collections.reduce((sum, c) => sum + c.pending, 0)
  const activeCollections = collections.length

  return (
    <main className="page-dashboard">
      <Header />
      
      <section className="panel">
        {!profile?.upi_id && (
          <div className="upi-warning" onClick={() => navigate('/settings')}>
            <span className="upi-warning-icon">⚠️</span>
            <div className="upi-warning-text">
              <strong>Set up UPI ID</strong>
              <p>Add your UPI ID so participants can pay you directly.</p>
            </div>
            <span className="upi-warning-arrow">→</span>
          </div>
        )}
        <div className="header-dash">
          <div>
            <p className="greeting">Namaste 👋</p>
            <h1 className="title-dash">Organiser dashboard</h1>
          </div>
          <div className="avatar">0</div>
        </div>

        <div className="summary-card">
          <div className="summary-top">
            <div>
              <small>Total collected this month</small>
            </div>
            <small>{collections.length > 0 ? Math.round((totalCollected / (totalCollected + totalPending)) * 100) : 0}% matched</small>
          </div>
          <div className="amount">₹{totalCollected}</div>

          <div className="status-row">
            <div className="status-pill">
              <small>Settled</small>
              <strong>₹{totalCollected}</strong>
            </div>
            <div className="status-pill">
              <small>Pending</small>
              <strong>₹{totalPending}</strong>
            </div>
            <div className="status-pill">
              <small>Active</small>
              <strong>{activeCollections}</strong>
            </div>
          </div>
        </div>

        <div className="actions-grid">
          <div className="action-card" onClick={() => navigate('/create-collection')}>
            <div className="action-icon">+</div>
            <div className="action-label">Create</div>
          </div>
          <div className="action-card" onClick={() => navigate('/groups')}>
            <div className="action-icon">👥</div>
            <div className="action-label">Groups</div>
          </div>
          <div className="action-card">
            <div className="action-icon">⟳</div>
            <div className="action-label">Reconcile</div>
          </div>
          <div className="action-card">
            <div className="action-icon">📈</div>
            <div className="action-label">Insights</div>
          </div>
        </div>

        <section className="section-dash">
          <div className="section-header">
            <h2>Recent collections</h2>
            <small>See all</small>
          </div>
          {collections.length === 0 ? (
            <div className="empty-state">No collections yet</div>
          ) : (
            <div className="recent-list">
              {collections.slice(-3).reverse().map(collection => (
                <SwipeableCard
                  key={collection.id}
                  id={collection.id}
                  actions={[
                    { type: 'view', handler: () => navigate(`/collection/${collection.id}`) },
                    { type: 'edit', handler: () => navigate(`/collection/${collection.id}/edit`) },
                    { type: 'delete', handler: async () => {
                      if (window.confirm('Delete this collection?')) {
                        await deleteCollection(collection.id)
                      }
                    }},
                  ]}
                >
                  <div className="recent-item" onClick={() => navigate('/collections')}>
                    <div className="recent-icon">⚽</div>
                    <div className="recent-details">
                      <div className="recent-title">{collection.title}</div>
                      <div className="recent-meta">{collection.participants.length} participants · ₹{collection.amount}</div>
                    </div>
                    <div className="recent-status">{collection.paid}/{collection.participants.length} paid</div>
                  </div>
                </SwipeableCard>
              ))}
            </div>
          )}
        </section>
      </section>

      <Footer />
    </main>
  )
}
