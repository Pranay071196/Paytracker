import { useNavigate } from 'react-router-dom'
import './GroupCard.css'

export default function GroupCard({ group, onShare }) {
  const navigate = useNavigate()

  const handleShare = (e) => {
    e.stopPropagation()
    if (onShare) onShare(group)
  }

  return (
    <div className="group-card" onClick={() => navigate(`/groups/${group.id}`)}>
      <div className="group-card-top">
        <div className="group-icon">👥</div>
        <div className="group-info">
          <h3 className="group-name">{group.name}</h3>
          {group.whatsapp_group_name && (
            <p className="group-whatsapp">📱 {group.whatsapp_group_name}</p>
          )}
        </div>
      </div>
      <div className="group-card-actions">
        <span className="group-invite-code">Code: {group.invite_code}</span>
        <button className="share-btn" onClick={handleShare}>
          Share invite
        </button>
      </div>
    </div>
  )
}
