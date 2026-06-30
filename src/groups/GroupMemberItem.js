import { useState } from 'react'
import { updateGroupMemberName, removeGroupMember } from '../lib/supabaseGroupHelpers'
import './GroupMemberItem.css'

export default function GroupMemberItem({ member, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(member.name || '')

  const startEditing = () => {
    setEditName(member.name || '')
    setEditing(true)
  }

  const saveName = async () => {
    try {
      const updated = await updateGroupMemberName(member.id, editName.trim())
      if (updated) {
        member.name = updated.name
      }
    } catch {
      // ignore
    }
    setEditing(false)
  }

  const cancelEditing = () => {
    setEditName(member.name || '')
    setEditing(false)
  }

  const handleRemove = () => {
    if (!window.confirm('Remove this member from the group?')) return
    removeGroupMember(member.id)
      .then(() => {
        if (onRemove) onRemove(member.id)
      })
      .catch(() => {})
  }

  return (
    <div className="member-item">
      <div className="member-avatar">
        {member.name ? member.name[0].toUpperCase() : member.phone.slice(-2)}
      </div>
      <div className="member-details">
        {editing ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="form-input"
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName()
                if (e.key === 'Escape') cancelEditing()
              }}
            />
            <button className="share-btn" onClick={saveName}>Save</button>
            <button
              className="share-btn"
              style={{ background: '#6b7280' }}
              onClick={cancelEditing}
            >✕</button>
          </div>
        ) : (
          <div className="member-name-row" onClick={startEditing} style={{ cursor: 'pointer' }}>
            <span className="member-name">{member.name || 'Unknown'}</span>
            <span className="edit-icon">✏️</span>
          </div>
        )}
        <span className="member-phone">{member.phone}</span>
      </div>
      <button
        className="share-btn"
        style={{ background: '#dc2626', padding: '4px 10px', fontSize: '0.75rem', flexShrink: 0 }}
        onClick={handleRemove}
      >
        Remove
      </button>
    </div>
  )
}
