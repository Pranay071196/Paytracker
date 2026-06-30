import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import { createGroup } from '../lib/supabaseGroupHelpers'
import '../styles/theme.css'
import './CreateGroupPage.css'

export default function CreateGroupPage() {
  const navigate = useNavigate()
  const { profile } = useApp()
  const [name, setName] = useState('')
  const [whatsappGroupName, setWhatsappGroupName] = useState('')
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return

    setSaving(true)
    setError('')

    if (profile && profile.id) {
      try {
        await createGroup(profile.id, {
          name: name.trim(),
          whatsappGroupName: whatsappGroupName.trim() || null,
          whatsappGroupLink: whatsappGroupLink.trim() || null,
        })
        setSaving(false)
        navigate('/groups')
      } catch (err) {
        setError(err.message || 'Failed to create group')
        setSaving(false)
      }
    } else {
      setError('Profile not loaded')
      setSaving(false)
    }
  }

  return (
    <main className="modal-screen">
      <div className="modal-card">
        <div className="modal-header">
          <button className="close-btn" onClick={() => navigate('/groups')}>✕</button>
          <h1>Create group</h1>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <label>GROUP NAME</label>
            <input
              type="text"
              placeholder="Cricket Club"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input filled"
            />
          </div>

          <div className="form-group">
            <label>WHATSAPP GROUP NAME (optional)</label>
            <input
              type="text"
              placeholder="Cricket Club WhatsApp"
              value={whatsappGroupName}
              onChange={(e) => setWhatsappGroupName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>WHATSAPP GROUP LINK (optional)</label>
            <input
              type="text"
              placeholder="https://chat.whatsapp.com/..."
              value={whatsappGroupLink}
              onChange={(e) => setWhatsappGroupLink(e.target.value)}
              className="form-input"
            />
          </div>

          {error && <p className="note" style={{ color: '#b91c1c', marginTop: 8 }}>{error}</p>}
        </div>

        <div className="modal-footer">
          <button
            className="create-btn"
            onClick={handleCreate}
            disabled={!name.trim() || saving}
          >
            {saving ? 'Creating...' : 'Create group'}
          </button>
        </div>
      </div>
    </main>
  )
}
