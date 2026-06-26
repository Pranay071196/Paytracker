import { useNavigate } from 'react-router-dom'
import { useApp } from './AppContext'
import './pages.css'

export default function Footer() {
  const navigate = useNavigate()
  const { user } = useApp()

  const navItems = [
    { icon: '🏠', label: 'Home', path: user.role === 'organiser' ? '/organiser-dashboard' : '/participant-dashboard' },
    { icon: '🗂', label: 'Collections', path: '/collections' },
    { icon: '⟳', label: 'Reconcile', path: '/reconcile' },
    { icon: '👤', label: 'You', path: '/settings' },
  ]

  return (
    <nav className="app-footer">
      <div className="footer-content">
        {navItems.map((item) => (
          <div 
            key={item.label} 
            className="footer-item"
            onClick={() => navigate(item.path)}
          >
            <div className="footer-icon">{item.icon}</div>
            <span className="footer-label">{item.label}</span>
          </div>
        ))}
      </div>
    </nav>
  )
}
