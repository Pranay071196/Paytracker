import { useNavigate } from 'react-router-dom'
import { useApp } from './AppContext'
import './pages.css'

export default function Header() {
  const navigate = useNavigate()
  const { theme, toggleTheme, user, updateUser } = useApp()

  const handleRoleSwitch = () => {
    const newRole = user.role === 'organiser' ? 'participant' : 'organiser'
    updateUser({ role: newRole })
    navigate(newRole === 'organiser' ? '/organiser-dashboard' : '/participant-dashboard')
  }

  const handleLogout = () => {
    updateUser({ role: 'organiser' })
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
            className="header-btn icon-btn logout-btn" 
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
