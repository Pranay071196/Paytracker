import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import { updateProfileUpiId, updateProfileName } from '../lib/supabaseHelpers'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import '../styles/theme.css'
import './SettingsPage.css'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme, user, profile, setProfile } = useApp()
  const [upiId, setUpiId] = useState(profile?.upi_id || '')
  const [upiSaved, setUpiSaved] = useState(false)
  const [upiSaving, setUpiSaving] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile?.full_name || '')
  const [nameSaving, setNameSaving] = useState(false)

  const displayPhone = profile?.phone || user.phone || 'Not set'
  const displayRole = profile?.role || user.role || 'participant'
  const displayName = profile?.full_name || 'Welcome'
  const isOrganiser = displayRole === 'organiser'

  const handleSaveUpi = async () => {
    if (!profile?.id) return
    setUpiSaving(true)
    setUpiSaved(false)
    try {
      const updated = await updateProfileUpiId(profile.id, upiId.trim())
      if (updated) setProfile(updated)
      setUpiSaved(true)
      setTimeout(() => setUpiSaved(false), 2000)
    } catch {
      setUpiSaved(false)
    } finally {
      setUpiSaving(false)
    }
  }

  const handleSaveName = async () => {
    if (!profile?.id || !nameInput.trim()) return
    setNameSaving(true)
    try {
      const updated = await updateProfileName(profile.id, nameInput.trim())
      if (updated) setProfile(updated)
      setEditingName(false)
    } catch {
      // ignore
    } finally {
      setNameSaving(false)
    }
  }

  return (
    <main className="page-settings">
      <Header />
      <section className="panel-settings">
        <div className="settings-header">
          <div className="avatar-large">9</div>
          <div className="header-text">
            {editingName ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '1rem' }}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                />
                <button className="share-btn" onClick={handleSaveName} disabled={nameSaving || !nameInput.trim()}>
                  {nameSaving ? '...' : 'Save'}
                </button>
                <button className="share-btn" style={{ background: '#6b7280' }} onClick={() => setEditingName(false)}>✕</button>
              </div>
            ) : (
              <h1 onClick={() => { setNameInput(profile?.full_name || ''); setEditingName(true) }} style={{ cursor: 'pointer' }}>
                {displayName} ✏️
              </h1>
            )}
            <p>{displayPhone}</p>
            <span className="role-badge">{displayRole.toUpperCase()}</span>
          </div>
        </div>

        <section className="settings-section">
          <h2 className="section-title-settings">Appearance</h2>
          <div className="settings-item">
            <div className="item-icon-settings">{theme === 'light' ? '☀️' : '🌙'}</div>
            <div className="item-text-settings">
              <span>Theme</span>
            </div>
            <button className="theme-switch" onClick={toggleTheme}>
              {theme === 'light' ? 'Light' : 'Dark'}
            </button>
          </div>
        </section>

        {isOrganiser && (
          <section className="settings-section">
            <h2 className="section-title-settings">Payments</h2>
            <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, paddingBottom: 18 }}>
              <div className="item-text-settings">
                <span>UPI ID</span>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Participants will use this to send payments.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. name@upi"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="button"
                  onClick={handleSaveUpi}
                  disabled={upiSaving}
                  style={{ width: 'auto', padding: '14px 20px', whiteSpace: 'nowrap' }}
                >
                  {upiSaving ? 'Saving...' : upiSaved ? 'Saved ✓' : 'Save'}
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="settings-section">
          <div className="settings-item" onClick={() => navigate('/select-role')}>
            <div className="item-icon-settings">⇄</div>
            <div className="item-text-settings">
              <span>Switch to {user.role === 'organiser' ? 'Participant' : 'Organiser'}</span>
            </div>
            <div className="item-arrow">›</div>
          </div>

          <div className="settings-item">
            <div className="item-icon-settings">🔔</div>
            <div className="item-text-settings">
              <span>Notifications</span>
            </div>
            <div className="item-arrow">›</div>
          </div>

          <div className="settings-item">
            <div className="item-icon-settings">🔒</div>
            <div className="item-text-settings">
              <span>Privacy & security</span>
            </div>
            <div className="item-arrow">›</div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title-settings">Reconciliation</h2>
          <div className="settings-item">
            <div className="item-icon-settings">📧</div>
            <div className="item-text-settings">
              <span>Gmail connection</span>
            </div>
            <div className="status-connected">Connected</div>
          </div>

          <div className="settings-item">
            <div className="item-icon-settings">📋</div>
            <div className="item-text-settings">
              <span>PhonePe statements</span>
            </div>
            <div className="item-arrow">›</div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title-settings">Support</h2>
          <div className="settings-item">
            <div className="item-icon-settings">❓</div>
            <div className="item-text-settings">
              <span>Help center</span>
            </div>
            <div className="item-arrow">›</div>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  )
}
