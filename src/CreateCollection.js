import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from './AppContext'
import './pages.css'

export default function CreateCollection() {
  const navigate = useNavigate()
  const { addCollection } = useApp()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('sports')
  const [amount, setAmount] = useState('')
  const [participants, setParticipants] = useState([])
  const [newPhone, setNewPhone] = useState('')

  const categories = [
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'travel', label: 'Travel', icon: '✈' },
    { id: 'events', label: 'Events', icon: '📅' }
  ]

  const addParticipant = () => {
    if (newPhone && !participants.includes(newPhone)) {
      setParticipants([...participants, newPhone])
      setNewPhone('')
    }
  }

  const removeParticipant = (phone) => {
    setParticipants(participants.filter(p => p !== phone))
  }

  const handleCreateCollection = () => {
    if (title && amount && participants.length > 0) {
      addCollection({
        title,
        category,
        amount: parseInt(amount),
        participants,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' })
      })
      navigate('/organiser-dashboard')
    }
  }

  return (
    <main className="modal-screen">
      <div className="modal-card">
        <div className="modal-header">
          <button className="close-btn" onClick={() => navigate('/organiser-dashboard')}>✕</button>
          <h1>New collection</h1>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <label>TITLE</label>
            <input 
              type="text" 
              placeholder="Saturday Cricket Match"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input filled"
            />
          </div>

          <div className="form-group">
            <label>CATEGORY</label>
            <div className="category-grid">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-btn ${category === cat.id ? 'active' : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>TARGET AMOUNT</label>
            <div className="amount-input">
              <span className="currency">₹</span>
              <input 
                type="number" 
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
              />
            </div>
            {amount && (
              <div className="amount-split">
                {participants.length} participants · ₹{Math.ceil(parseInt(amount) / Math.max(1, participants.length))} each
              </div>
            )}
          </div>

          <div className="form-group">
            <label>PARTICIPANTS</label>
            <div className="participant-input">
              <span className="phone-prefix">+91</span>
              <input 
                type="tel" 
                placeholder="98765 43210"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <button className="add-btn" onClick={addParticipant}>+</button>
            </div>
            {participants.length === 0 && (
              <p className="helper-text">No one added yet. Tap + to add.</p>
            )}
            <div className="participants-list">
              {participants.map(phone => (
                <div key={phone} className="participant-tag">
                  <span>{phone}</span>
                  <button onClick={() => removeParticipant(phone)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="create-btn"
            onClick={handleCreateCollection}
            disabled={!title || !amount || participants.length === 0}
          >
            Create collection
          </button>
        </div>
      </div>
    </main>
  )
}
