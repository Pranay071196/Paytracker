import { useApp } from './AppContext'
import Header from './Header'
import Footer from './Footer'
import './pages.css'

export default function ParticipantDashboard() {
  const { collections } = useApp()

  const pendingCollections = collections.filter(c => c.pending > 0)
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
          <div className="pending-status">{collections.reduce((sum, c) => sum + c.paid, 0)} paid · {pendingCollections.length} pending</div>
        </div>

        <section className="collections-list">
          <h2 className="section-title">Pending</h2>
          <div className="list-count">{pendingCollections.length}</div>

          {pendingCollections.length === 0 ? (
            <div className="empty-state">No pending collections</div>
          ) : (
            pendingCollections.map(collection => (
              <div key={collection.id} className="collection-item">
                <div className="item-icon">⚽</div>
                <div className="item-details">
                  <div className="item-title">{collection.title}</div>
                  <div className="item-date">{collection.date}</div>
                  <div className="item-meta">Due soon</div>
                </div>
                <div className="item-amount">₹{collection.amount}</div>
                <div className="item-status pending-badge">Pending</div>
              </div>
            ))
          )}
        </section>
      </section>

      <Footer />
    </main>
  )
}
