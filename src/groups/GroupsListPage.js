import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import { fetchGroupsForOrganiser, deleteGroupFromSupabase } from '../lib/supabaseGroupHelpers'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import SwipeableCard from '../common/SwipeableCard'
import GroupCard from './GroupCard'
import './GroupsListPage.css'

export default function GroupsListPage() {
  const navigate = useNavigate()
  const { profile } = useApp()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile && profile.id) {
      setLoading(true)
      fetchGroupsForOrganiser(profile.id)
        .then(setGroups)
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [profile])

  const shareInvite = (group) => {
    const link = `${window.location.origin}${process.env.PUBLIC_URL || ''}/join-group/${group.invite_code}`
    if (navigator.share) {
      navigator.share({ title: group.name, text: `Join my group on PayTracker: ${link}` })
    } else {
      navigator.clipboard.writeText(link)
    }
  }

  const handleDelete = async (groupId) => {
    if (!window.confirm('Delete this group? Members will be removed.')) return
    try {
      await deleteGroupFromSupabase(groupId)
      setGroups(prev => prev.filter(g => g.id !== groupId))
    } catch {
      // ignore
    }
  }

  return (
    <main className="page-groups">
      <Header />
      <section className="panel-groups">
        <div className="groups-header">
          <h1>Groups</h1>
          <button className="add-collection-btn" onClick={() => navigate('/create-group')}>+</button>
        </div>

        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="empty-state">No groups yet</div>
        ) : (
          <div className="groups-grid">
            {groups.map(group => (
              <SwipeableCard
                key={group.id}
                id={group.id}
                actions={[
                  { type: 'delete', handler: () => handleDelete(group.id) },
                ]}
              >
                <GroupCard group={group} onShare={shareInvite} />
              </SwipeableCard>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  )
}
