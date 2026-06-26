import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useApp } from './AppContext'
import { createOrFetchProfile } from './lib/supabaseHelpers'
import SimpleHeader from './SimpleHeader'
import './pages.css'

export default function RoleSelection() {
  const navigate = useNavigate()
  const { setProfile, updateUser } = useApp()
  const [selectedRole, setSelectedRole] = useState('participant')

  const handleContinue = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('[RoleSelection] Session:', !!session)
    if (session) {
      const phone = localStorage.getItem('pendingPhone')
      try {
        const profileData = await createOrFetchProfile(session.user, {
          phone: phone || undefined,
          role: selectedRole,
        })
        if (profileData) {
          setProfile(profileData)
          updateUser({
            phone: profileData.phone || phone || '',
            role: selectedRole,
            name: profileData.full_name || 'User',
          })
          console.log('[RoleSelection] Profile set:', profileData.id, profileData.role)
        } else {
          console.warn('[RoleSelection] createOrFetchProfile returned null')
        }
      } catch (err) {
        console.warn('[RoleSelection] Profile error:', err?.message || err)
      }
    }

    if (selectedRole === 'organiser') {
      navigate('/organiser-dashboard')
    } else {
      navigate('/participant-dashboard')
    }
  }

  return (
    <>
      <SimpleHeader />
      <article className="screen-alt">
        <div className="content-alt">
        <p className="eyebrow">One last thing</p>
        <h1>How will you use PayCollect?</h1>
        <p className="subtitle">You can switch later from Settings.</p>

        <div className="option">
          <div 
            className={`card-role ${selectedRole === 'organiser' ? 'primary' : ''}`}
            onClick={() => setSelectedRole('organiser')}
          >
            <div className="icon">👥</div>
            <div className="details">
              <strong>I'm an Organiser</strong>
              <p>Create collections, invite participants, upload PhonePe statements and reconcile.</p>
            </div>
            <div className={`indicator ${selectedRole === 'organiser' ? 'active' : ''}`}></div>
          </div>

          <div 
            className={`card-role ${selectedRole === 'participant' ? 'primary' : ''}`}
            onClick={() => setSelectedRole('participant')}
          >
            <div className="icon">👤</div>
            <div className="details">
              <strong>I'm a Participant</strong>
              <p>Auto-match PhonePe & Gmail receipts. Track who's paid, who's not.</p>
            </div>
            <div className={`indicator ${selectedRole === 'participant' ? 'active' : ''}`}></div>
          </div>
        </div>
      </div>

      <button className="continue" onClick={handleContinue}>Continue</button>
    </article>
    </>
  )
}
