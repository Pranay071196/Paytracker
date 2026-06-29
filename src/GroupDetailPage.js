import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from './AppContext'
import { fetchGroupById, fetchGroupMembers, updateGroupMemberName } from './lib/supabaseGroupHelpers'
import Header from './Header'
import Footer from './Footer'
import './pages.css'

export default function GroupDetailPage() {
  const { groupId } = useParams()
  const { profile } = useApp()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    if (profile?.id && groupId) {
      setLoading(true)
      Promise.all([
        fetchGroupById(groupId),
        fetchGroupMembers(groupId),
      ])
        .then(([groupData, membersData]) => {
          setGroup(groupData)
          setMembers(membersData)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [profile, groupId])

  const inviteLink = group ? `${window.location.origin}${process.env.PUBLIC_URL || ''}/join-group/${group.invite_code}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
  }

  const startEditing = (member) => {
    setEditingId(member.id)
    setEditName(member.name || '')
  }

  const saveName = async (memberId) => {
    try {
      const updated = await updateGroupMemberName(memberId, editName.trim())
      if (updated) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, name: updated.name } : m))
      }
    } catch {
      // ignore
    }
    setEditingId(null)
    setEditName('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
  }

  return (
    <main className="page-groups">
      <Header />
      <section className="panel-groups">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : !group ? (
          <div className="empty-state">Group not found</div>
        ) : (
          <>
            <div className="groups-header" style={{ marginBottom: 8 }}>
              <h1>{group.name}</h1>
            </div>

            {group.whatsapp_group_name && (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 4 }}>
                📱 WhatsApp: {group.whatsapp_group_name}
              </p>
            )}

            <div className="invite-row">
              <span className="invite-link-text">{inviteLink}</span>
              <button className="share-btn" onClick={copyLink}>Copy</button>
            </div>

            <h2 className="section-title" style={{ marginTop: 28 }}>
              Members ({members.length})
            </h2>

            {members.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 12 }}>No members yet</div>
            ) : (
              <div className="members-list">
                {members.map(member => (
                  <div key={member.id} className="member-item">
                    <div className="member-avatar">
                      {member.name ? member.name[0].toUpperCase() : member.phone.slice(-2)}
                    </div>
                    <div className="member-details">
                      {editingId === member.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="form-input"
                            style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveName(member.id)
                              if (e.key === 'Escape') cancelEditing()
                            }}
                          />
                          <button className="share-btn" onClick={() => saveName(member.id)}>Save</button>
                          <button
                            className="share-btn"
                            style={{ background: '#6b7280' }}
                            onClick={cancelEditing}
                          >✕</button>
                        </div>
                      ) : (
                        <div
                          className="member-name-row"
                          onClick={() => startEditing(member)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="member-name">{member.name || 'Unknown'}</span>
                          <span className="edit-icon">✏️</span>
                        </div>
                      )}
                      <span className="member-phone">{member.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <Footer />
    </main>
  )
}
