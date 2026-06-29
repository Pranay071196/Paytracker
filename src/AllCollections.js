import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from './AppContext'
import Header from './Header'
import Footer from './Footer'
import SwipeableCard from './SwipeableCard'
import './pages.css'

export default function AllCollections() {
  const navigate = useNavigate()
  const { collections, deleteCollection, refreshCollections } = useApp()

  useEffect(() => {
    refreshCollections()
  }, [refreshCollections])
  const [selectedFilter, setSelectedFilter] = useState('all')

  const filters = ['All', 'Sports', 'Travel', 'Events']
  const filteredCollections = selectedFilter === 'all' 
    ? collections 
    : collections.filter(c => c.category === selectedFilter.toLowerCase())

  return (
    <main className="page-collections">
      <Header />
      <section className="panel-collections">
        <div className="collections-header">
          <h1>Collections</h1>
          <button className="add-collection-btn" onClick={() => navigate('/create-collection')}>+</button>
        </div>

        <div className="filter-tabs">
          {filters.map(filter => (
            <button
              key={filter}
              className={`filter-tab ${selectedFilter === filter.toLowerCase() ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter.toLowerCase())}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="collections-grid">
          {filteredCollections.length === 0 ? (
            <div className="empty-state">No collections yet</div>
          ) : (
            filteredCollections.map(collection => (
              <SwipeableCard
                key={collection.id}
                id={collection.id}
                actions={[
                  { type: 'edit', handler: () => navigate(`/collection/${collection.id}/edit`) },
                  { type: 'delete', handler: async () => {
                    if (window.confirm('Delete this collection? This cannot be undone.')) {
                      await deleteCollection(collection.id)
                    }
                  }},
                ]}
              >
                <div 
                  className="collection-card"
                  onClick={() => navigate(`/collection/${collection.id}`)}
                >
                  <div className="card-icon">⚽</div>
                  <div className="card-content">
                    <h3 className="card-title">{collection.title}</h3>
                    <p className="card-date">{collection.date}</p>
                    <span className="card-category">{collection.category.toUpperCase()}</span>
                  </div>
                  <div className="card-stats">
                    <div className="stat-row">
                      <span className="label">Collected</span>
                      <span className="value">₹{collection.collected}</span>
                    </div>
                    <div className="stat-row">
                      <span className="label">Target</span>
                      <span className="value">₹{collection.amount}</span>
                    </div>
                    <div className="stat-row">
                      <span className="label">Pending</span>
                      <span className="value pending">₹{collection.pending}</span>
                    </div>
                  </div>
                </div>
              </SwipeableCard>
            ))
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
