import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../AppContext'
import { fetchGroupById, fetchGroupMembers } from '../lib/supabaseGroupHelpers'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import GroupMemberItem from './GroupMemberItem'
import './GroupDetailPage.css'
import './GroupsListPage.css'

export default function GroupDetailPage() {
  const { groupId } = useParams()
  const { profile } = useApp()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

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

  const handleRemoveMember = (memberId) => {
    setMembers(prev => prev.filter(m => m.id !== memberId))
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
                  <GroupMemberItem
                    key={member.id}
                    member={member}
                    onRemove={handleRemoveMember}
                  />
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
