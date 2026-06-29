import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useApp } from './AppContext'
import { createCollectionWithParticipants } from './lib/supabaseHelpers'
import { updateProfileUpiId } from './lib/supabaseHelpers'
import { fetchGroupsForOrganiser, fetchGroupMembers } from './lib/supabaseGroupHelpers'
import { normalizePhoneNumber } from './LoginScreen'
import './pages.css'

export default function CreateCollection() {
  const navigate = useNavigate()
  const { refreshCollections, profile, setProfile } = useApp()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('sports')
  const [amount, setAmount] = useState('')
  const [participants, setParticipants] = useState([])
  const [newPhone, setNewPhone] = useState('')
  const [upiId, setUpiId] = useState(profile?.upi_id || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [groupMembers, setGroupMembers] = useState([])
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const categories = [
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'travel', label: 'Travel', icon: '✈' },
    { id: 'events', label: 'Events', icon: '📅' }
  ]

  useEffect(() => {
    if (profile?.id) {
      fetchGroupsForOrganiser(profile.id).then(setGroups).catch(() => {})
    }
  }, [profile])

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupMembers(selectedGroupId).then(setGroupMembers).catch(() => setGroupMembers([]))
    } else {
      setGroupMembers([])
    }
  }, [selectedGroupId])

  const addParticipant = () => {
    const normalized = normalizePhoneNumber(newPhone)
    if (normalized && !participants.includes(normalized)) {
      setParticipants([...participants, normalized])
      setNewPhone('')
    }
  }

  const removeParticipant = (phone) => {
    setParticipants(participants.filter(p => p !== phone))
  }

  const toggleGroupMember = (member) => {
    const phone = member.phone
    if (participants.includes(phone)) {
      setParticipants(prev => prev.filter(p => p !== phone))
    } else {
      setParticipants(prev => [...prev, phone])
    }
  }

  const addFromContact = () => {
    const phone = normalizePhoneNumber(contactPhone)
    if (phone && !participants.includes(phone)) {
      setParticipants(prev => [...prev, phone])
      setContactName('')
      setContactPhone('')
    }
  }

  const handleCreateCollection = async () => {
    if (!title || !amount || participants.length === 0) return

    setSaving(true)
    setError('')

    if (profile && profile.id) {
      try {
        if (upiId.trim() && upiId.trim() !== (profile.upi_id || '')) {
          const updated = await updateProfileUpiId(profile.id, upiId.trim())
          if (updated) setProfile(updated)
        }
        await createCollectionWithParticipants(profile.id, {
          title,
          category,
          targetAmount: parseInt(amount),
          participantPhones: participants,
        })
        await refreshCollections()
        setSaving(false)
        navigate('/organiser-dashboard')
        return
      } catch (err) {
        setError(err.message || 'Failed to create collection')
        setSaving(false)
        return
      }
    }

    setError('Profile not loaded. Please try signing in again.')
    setSaving(false)
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

          {groups.length > 0 && (
            <div className="form-group">
              <label>ADD FROM GROUP</label>
              <select
                className="form-input"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="">Select a group</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              {selectedGroupId && groupMembers.length > 0 && (
                <div className="group-members-list">
                  {groupMembers.map(member => (
                    <label key={member.id} className="group-member-check">
                      <input
                        type="checkbox"
                        checked={participants.includes(member.phone)}
                        onChange={() => toggleGroupMember(member)}
                      />
                      <span>{member.name || member.phone}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label>ADD FROM CONTACTS</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button className="add-btn" onClick={addFromContact} disabled={!contactPhone.trim()}>+</button>
            </div>
          </div>

          <div className="form-group">
            <label>YOUR UPI ID (for payments)</label>
            <input
              type="text"
              placeholder="e.g. name@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="form-input"
            />
            {!upiId && <p className="helper-text">Participants need this to pay you. You can also set it in Settings.</p>}
          </div>

          {error && <p className="note" style={{ color: '#b91c1c', marginTop: 8 }}>{error}</p>}
        </div>

        <div className="modal-footer">
          <button 
            className="create-btn"
            onClick={handleCreateCollection}
            disabled={!title || !amount || participants.length === 0 || saving}
          >
            {saving ? 'Creating...' : 'Create collection'}
          </button>
        </div>
      </div>
    </main>
  )
}
