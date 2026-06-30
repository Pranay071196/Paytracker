import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useApp } from '../AppContext'
import { createOrFetchProfile } from '../lib/supabaseHelpers'
import '../styles/theme.css'
import './Header.css'

export default function Header() {
  const navigate = useNavigate()
  const { theme, toggleTheme, user, updateUser, profile, setProfile } = useApp()

  const handleRoleSwitch = async () => {
    const newRole = user.role === 'organiser' ? 'participant' : 'organiser'
    updateUser({ role: newRole })

    if (profile && profile.id) {
      await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const updated = await createOrFetchProfile(session.user, { role: newRole })
        if (updated) setProfile(updated)
      }
    }

    navigate(newRole === 'organiser' ? '/organiser-dashboard' : '/participant-dashboard')
  }

  const handleLogout = () => {
    supabase.auth.signOut()
    localStorage.removeItem('pendingPhone')
    updateUser({ role: 'organiser', phone: '', name: 'You' })
    setProfile(null)
    navigate('/')
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <div className="brand">
            <span className="dot"></span>
            <span>PayCollect</span>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="header-btn icon-btn role-switch" 
            onClick={handleRoleSwitch}
            title={`Switch to ${user.role === 'organiser' ? 'Participant' : 'Organiser'}`}
          >
            ⇄
          </button>

          <button 
            className="header-btn icon-btn theme-toggle" 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button 
            className="header-btn icon-btn" 
            onClick={handleLogout}
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </div>
    </header>
  )
}
