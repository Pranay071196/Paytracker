import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import '../styles/theme.css'
import './Footer.css'

export default function Footer() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme, user, updateUser } = useApp()

  const navItems = [
    { icon: '🏠', label: 'Home', path: user.role === 'organiser' ? '/organiser-dashboard' : '/participant-dashboard' },
    { icon: '🗂', label: 'Collections', path: '/collections' },
    { icon: '⟳', label: 'Reconcile', path: '/reconcile' },
    { icon: '👤', label: 'You', path: '/settings' },
  ]

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
    <nav className="app-footer" aria-label="Primary navigation">
      <button type="button" className="footer-brand" onClick={() => navigate(navItems[0].path)}>
        <span className="footer-brand-mark">P</span>
        <span className="footer-brand-copy">
          <strong>Paytracker</strong>
          <small>Collections</small>
        </span>
      </button>

      <div className="footer-content">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.label} 
            className={`footer-item${location.pathname === item.path ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <div className="footer-icon">{item.icon}</div>
            <span className="footer-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="footer-controls" aria-label="App controls">
        <button
          type="button"
          className="footer-control"
          onClick={handleRoleSwitch}
          title={`Switch to ${user.role === 'organiser' ? 'Participant' : 'Organiser'}`}
        >
          <span className="footer-control-icon">⇄</span>
          <span>{user.role === 'organiser' ? 'Participant' : 'Organiser'}</span>
        </button>

        <button
          type="button"
          className="footer-control"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <span className="footer-control-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
        </button>

        <button
          type="button"
          className="footer-control danger"
          onClick={handleLogout}
          title="Logout"
        >
          <span className="footer-control-icon">⏻</span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
